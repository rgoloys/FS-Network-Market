import base64
import json
import os
import urllib.error
import urllib.request
import uuid
from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Avg, Max, Min, Q, Sum
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import (
    CartUser,
    Order,
    OrderItem,
    Prodct,
    ProductReview,
    UserProfile,
    WishlistItem,
    paymentMethod,
    shippingAddress,
)
from .permissions import IsBusinessUser
from .serializers import (
    BusinessCustomerSerializer,
    BusinessOrderSerializer,
    BusinessProductReviewSerializer,
    CartUserSerializer,
    MeSerializer,
    OrderSerializer,
    PasswordChangeSerializer,
    PaymentMethodSerializer,
    ProdctSerializer,
    ProductReviewSerializer,
    ProfilePhotoSerializer,
    RegisterSerializer,
    ShippingAddressSerializer,
    UserProfileSerializer,
    UserSerializer,
    WishlistItemSerializer,
)

MONEY_QUANTIZER = Decimal('0.01')
XENDIT_INVOICE_URL = 'https://api.xendit.co/v2/invoices'


def parse_qty(value):
    try:
        qty = int(value)
    except (TypeError, ValueError):
        return None

    if qty < 1:
        return None

    return qty


def parse_decimal(value):
    if value in (None, ''):
        return None

    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ['1', 'true', 'yes', 'on']
    return bool(value)


def money(value):
    return Decimal(value).quantize(MONEY_QUANTIZER)


def get_effective_price(product):
    price = Decimal(product.product_price or 0)
    discount = Decimal(product.discount_percent or 0)
    if discount <= 0:
        return money(price)
    return money(price * (Decimal('100') - discount) / Decimal('100'))


def get_product(pk, active_only=True):
    try:
        products = Prodct.objects.all()
        if active_only:
            products = products.filter(is_active=True)
        return products.get(id=pk)
    except (Prodct.DoesNotExist, TypeError, ValueError):
        return None


def get_business_products_queryset(request):
    products = Prodct.objects.all()
    if request.user.is_superuser:
        return products
    return products.filter(owner=request.user)


def get_business_product_ids(request):
    return list(get_business_products_queryset(request).values_list('id', flat=True))


def get_business_orders_queryset(request):
    return Order.objects.filter(
        items__product_id__in=get_business_product_ids(request)
    ).distinct()


def get_cart_items(user):
    return CartUser.objects.select_related('product').filter(user=user)


def user_can_review_product(user, product):
    if not user.is_authenticated:
        return False

    return OrderItem.objects.filter(
        order__user=user,
        product=product,
    ).filter(
        Q(order__status=Order.STATUS_DELIVERED)
        | Q(fulfillment_status=OrderItem.FULFILLMENT_DELIVERED)
    ).exists()


@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    products = Prodct.objects.filter(is_active=True)
    query = request.query_params

    search = query.get('search', '').strip()
    if search:
        products = products.filter(
            Q(product_name__icontains=search)
            | Q(brand__icontains=search)
            | Q(category__icontains=search)
            | Q(description__icontains=search)
        )

    category = query.get('category', '').strip()
    if category:
        products = products.filter(category__iexact=category)

    brand = query.get('brand', '').strip()
    if brand:
        products = products.filter(brand__iexact=brand)

    in_stock = query.get('in_stock', '').lower()
    if in_stock in ['1', 'true', 'yes']:
        products = products.filter(countInStock__gt=0)

    min_price = parse_decimal(query.get('min_price'))
    max_price = parse_decimal(query.get('max_price'))
    if query.get('min_price') and min_price is None:
        return Response(
            {'min_price': 'Enter a valid minimum price.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if query.get('max_price') and max_price is None:
        return Response(
            {'max_price': 'Enter a valid maximum price.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if min_price is not None:
        products = products.filter(product_price__gte=min_price)
    if max_price is not None:
        products = products.filter(product_price__lte=max_price)

    ordering_map = {
        'name': 'product_name',
        'price': 'product_price',
        'price_desc': '-product_price',
        'newest': '-createdAt',
        'featured': '-is_featured',
    }
    ordering = ordering_map.get(query.get('ordering'), '-is_featured')
    products = products.order_by(ordering, 'product_name')

    serializer = ProdctSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_filters(request):
    active_products = Prodct.objects.filter(is_active=True)
    summary = active_products.aggregate(
        min_price=Min('product_price'),
        max_price=Max('product_price'),
    )
    brands = list(
        active_products.exclude(brand='')
        .order_by('brand')
        .values_list('brand', flat=True)
        .distinct()
    )
    categories = list(
        active_products.exclude(category='')
        .order_by('category')
        .values_list('category', flat=True)
        .distinct()
    )

    return Response(
        {
            'brands': brands,
            'categories': categories,
            'min_price': str(summary['min_price'] or 0),
            'max_price': str(summary['max_price'] or 0),
        }
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_by_id(request, pk):
    product = get_product(pk)
    if not product:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ProdctSerializer(product)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    qty = parse_qty(request.data.get('qty', 1))
    if qty is None:
        return Response(
            {'error': 'Quantity must be at least 1'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    product = get_product(product_id)
    if not product:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    cart_item, created = CartUser.objects.get_or_create(
        user=request.user,
        product=product,
    )
    next_qty = qty if created else cart_item.qty + qty

    if next_qty > product.countInStock:
        return Response(
            {'error': f'Only {product.countInStock} item(s) are available.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_item.qty = next_qty
    cart_item.save()
    serializer = CartUserSerializer(cart_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, pk):
    qty = parse_qty(request.data.get('qty'))
    if qty is None:
        return Response(
            {'error': 'Quantity must be at least 1'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        cart_item = CartUser.objects.select_related('product').get(
            id=pk,
            user=request.user,
        )
    except CartUser.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if qty > cart_item.product.countInStock:
        return Response(
            {'error': f'Only {cart_item.product.countInStock} item(s) are available.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_item.qty = qty
    cart_item.save()
    serializer = CartUserSerializer(cart_item)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def read_cart(request):
    cart_items = get_cart_items(request.user)
    serializer = CartUserSerializer(cart_items, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, pk):
    try:
        cart_item = CartUser.objects.get(id=pk, user=request.user)
    except CartUser.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    cart_item.delete()
    return Response(
        {'message': 'Product removed from cart'},
        status=status.HTTP_200_OK,
    )


def get_shipping_payload(request, profile):
    data = request.data or {}
    shipping_data = data.get('shipping') if isinstance(data.get('shipping'), dict) else {}
    user = request.user

    defaults = {
        'shipping_full_name': profile.full_name
        or profile.display_name
        or user.get_full_name()
        or user.username,
        'shipping_email': user.email,
        'shipping_phone_number': profile.phone_number,
        'shipping_country': profile.country,
        'shipping_city_province': profile.city_province,
        'shipping_address': profile.address,
        'shipping_postal_code': profile.postal_code,
    }
    aliases = {
        'shipping_full_name': ['shipping_full_name', 'full_name'],
        'shipping_email': ['shipping_email', 'email'],
        'shipping_phone_number': ['shipping_phone_number', 'phone_number'],
        'shipping_country': ['shipping_country', 'country'],
        'shipping_city_province': ['shipping_city_province', 'city_province'],
        'shipping_address': ['shipping_address', 'address'],
        'shipping_postal_code': ['shipping_postal_code', 'postal_code'],
    }

    payload = {}
    errors = {}
    for key, field_aliases in aliases.items():
        value = ''
        for alias in field_aliases:
            value = data.get(alias, shipping_data.get(alias, ''))
            if value:
                break
        value = str(value or defaults[key] or '').strip()
        payload[key] = value
        if not value:
            errors[key] = 'This field is required.'

    return payload, errors


def get_frontend_base_url():
    return os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')


def get_xendit_invoice_payload(data):
    if isinstance(data, dict) and isinstance(data.get('data'), dict):
        return data['data']
    return data if isinstance(data, dict) else {}


def create_xendit_invoice(payment, order):
    secret_key = os.getenv('XENDIT_SECRET_KEY', '').strip()
    if not secret_key:
        raise RuntimeError('Xendit secret key is not configured.')

    frontend_base_url = get_frontend_base_url()
    payload = {
        'external_id': payment.xendit_external_id,
        'amount': float(order.total_amount),
        'payer_email': order.shipping_email,
        'description': f'FS Network Market Order #{order.id}',
        'success_redirect_url': (
            f'{frontend_base_url}/payment/success?order_id={order.id}'
        ),
        'failure_redirect_url': (
            f'{frontend_base_url}/payment/failed?order_id={order.id}'
        ),
    }
    body = json.dumps(payload).encode('utf-8')
    auth_token = base64.b64encode(f'{secret_key}:'.encode('utf-8')).decode('utf-8')
    request = urllib.request.Request(
        XENDIT_INVOICE_URL,
        data=body,
        method='POST',
        headers={
            'Authorization': f'Basic {auth_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        response_body = response.read().decode('utf-8')
        return json.loads(response_body)


def restore_order_stock_once(order):
    if order.status == Order.STATUS_CANCELLED:
        return

    for order_item in order.items.select_related('product'):
        product = order_item.product
        product.countInStock += order_item.qty
        product.save(update_fields=['countInStock'])

    order.status = Order.STATUS_CANCELLED
    order.payment_status = Order.PAYMENT_FAILED
    order.save(update_fields=['status', 'payment_status', 'updatedAt'])


def close_failed_payment(payment, xendit_status_value):
    with transaction.atomic():
        payment = (
            paymentMethod.objects.select_for_update()
            .select_related('order')
            .get(id=payment.id)
        )
        if payment.isPaid:
            return payment

        payment.xendit_status = xendit_status_value
        payment.save(update_fields=['xendit_status'])

        if payment.order_id:
            restore_order_stock_once(payment.order)

        return payment


def create_order_for_xendit_checkout(request, shipping_payload):
    cart_items = list(get_cart_items(request.user))
    if not cart_items:
        return None, {'error': 'Your cart is empty.'}, status.HTTP_400_BAD_REQUEST

    with transaction.atomic():
        product_ids = [item.product_id for item in cart_items]
        products = {
            product.id: product
            for product in Prodct.objects.select_for_update().filter(id__in=product_ids)
        }

        subtotal = Decimal('0.00')
        discount_amount = Decimal('0.00')
        prepared_items = []
        stock_errors = {}

        for cart_item in cart_items:
            product = products.get(cart_item.product_id)
            if not product:
                stock_errors[str(cart_item.id)] = 'Product is no longer available.'
                continue
            if cart_item.qty > product.countInStock:
                stock_errors[str(cart_item.id)] = (
                    f'Only {product.countInStock} item(s) are available for '
                    f'{product.product_name}.'
                )
                continue

            unit_price = get_effective_price(product)
            line_total = money(unit_price * cart_item.qty)
            original_total = money(Decimal(product.product_price) * cart_item.qty)
            subtotal += line_total
            discount_amount += original_total - line_total
            prepared_items.append((cart_item, product, unit_price, line_total))

        if stock_errors:
            return None, {'stock': stock_errors}, status.HTTP_400_BAD_REQUEST

        shipping_fee = Decimal('0.00')
        tax_amount = Decimal('0.00')
        total_amount = money(subtotal + shipping_fee + tax_amount)
        order = Order.objects.create(
            user=request.user,
            payment_status=Order.PAYMENT_PENDING,
            subtotal=money(subtotal),
            shipping_fee=shipping_fee,
            tax_amount=tax_amount,
            discount_amount=money(discount_amount),
            total_amount=total_amount,
            **shipping_payload,
        )
        order_items = []
        for cart_item, product, unit_price, line_total in prepared_items:
            order_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.product_name,
                    brand=product.brand,
                    unit_price=unit_price,
                    qty=cart_item.qty,
                    line_total=line_total,
                )
            )
            product.countInStock -= cart_item.qty
            product.save(update_fields=['countInStock'])

        OrderItem.objects.bulk_create(order_items)
        external_id = f'fs-network-order-{order.id}-{uuid.uuid4().hex[:12]}'
        payment = paymentMethod.objects.create(
            user=request.user,
            order=order,
            totalPrice=order.total_amount,
            xendit_external_id=external_id,
            xendit_status='PENDING',
        )
        saved_shipping = shippingAddress.objects.create(
            paymentId=payment,
            fullName=shipping_payload['shipping_full_name'],
            address=shipping_payload['shipping_address'],
            city=shipping_payload['shipping_city_province'],
            postalCode=shipping_payload['shipping_postal_code'],
            country=shipping_payload['shipping_country'],
        )
        invoice = create_xendit_invoice(payment, order)
        invoice_url = invoice.get('invoice_url')
        if not invoice_url:
            raise RuntimeError('Xendit did not return an invoice URL.')

        payment.xendit_invoice_id = invoice.get('id', '')
        payment.xendit_status = invoice.get('status', 'PENDING')
        payment.save(
            update_fields=[
                'xendit_invoice_id',
                'xendit_status',
            ]
        )
        CartUser.objects.filter(user=request.user).delete()

    return (
        {
            'order': order,
            'payment': payment,
            'shipping_address': saved_shipping,
            'invoice_url': invoice_url,
        },
        None,
        status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def xendit_checkout(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    shipping_payload, shipping_errors = get_shipping_payload(request, profile)
    if shipping_errors:
        return Response(shipping_errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        checkout, error_data, response_status = create_order_for_xendit_checkout(
            request,
            shipping_payload,
        )
    except urllib.error.HTTPError as error:
        error_body = error.read().decode('utf-8', errors='replace')
        return Response(
            {
                'error': 'Unable to create Xendit invoice.',
                'details': error_body,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except (urllib.error.URLError, TimeoutError, RuntimeError) as error:
        return Response(
            {'error': str(error)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if error_data:
        return Response(error_data, status=response_status)

    order = (
        Order.objects.prefetch_related('items__product')
        .select_related('user')
        .get(id=checkout['order'].id)
    )
    return Response(
        {
            'order': OrderSerializer(order).data,
            'payment': PaymentMethodSerializer(checkout['payment']).data,
            'shipping_address': ShippingAddressSerializer(
                checkout['shipping_address']
            ).data,
            'invoice_url': checkout['invoice_url'],
        },
        status=response_status,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def xendit_webhook(request):
    callback_token = os.getenv('XENDIT_WEBHOOK_TOKEN', '').strip()
    if not callback_token:
        return Response(
            {'error': 'Xendit webhook token is not configured.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    received_token = request.headers.get('x-callback-token', '')
    if received_token != callback_token:
        return Response(
            {'error': 'Invalid Xendit callback token.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    payload = get_xendit_invoice_payload(request.data)
    external_id = payload.get('external_id', '')
    invoice_id = payload.get('id') or payload.get('invoice_id') or ''
    xendit_status_value = str(payload.get('status', '')).upper()

    payment_query = paymentMethod.objects.select_related('order')
    payment = None
    if external_id:
        payment = payment_query.filter(xendit_external_id=external_id).first()
    if payment is None and invoice_id:
        payment = payment_query.filter(xendit_invoice_id=invoice_id).first()
    if payment is None:
        return Response({'message': 'Payment record not found.'})

    if invoice_id and not payment.xendit_invoice_id:
        payment.xendit_invoice_id = invoice_id
        payment.save(update_fields=['xendit_invoice_id'])

    if xendit_status_value in ['PAID', 'SETTLED']:
        payment.mark_paid()
        return Response({'message': 'Payment marked as paid.'})

    if xendit_status_value in ['EXPIRED', 'FAILED', 'CANCELLED']:
        close_failed_payment(payment, xendit_status_value)
        return Response({'message': 'Payment closed.'})

    if xendit_status_value:
        payment.xendit_status = xendit_status_value
        payment.save(update_fields=['xendit_status'])

    return Response({'message': 'Webhook processed.'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def orders(request):
    if request.method == 'GET':
        user_orders = (
            Order.objects.filter(user=request.user)
            .prefetch_related('items__product')
            .order_by('-createdAt')
        )
        serializer = OrderSerializer(user_orders, many=True)
        return Response(serializer.data)

    cart_items = list(get_cart_items(request.user))
    if not cart_items:
        return Response(
            {'error': 'Your cart is empty.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    shipping_payload, shipping_errors = get_shipping_payload(request, profile)
    if shipping_errors:
        return Response(shipping_errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        product_ids = [item.product_id for item in cart_items]
        products = {
            product.id: product
            for product in Prodct.objects.select_for_update().filter(id__in=product_ids)
        }

        subtotal = Decimal('0.00')
        discount_amount = Decimal('0.00')
        prepared_items = []
        stock_errors = {}

        for cart_item in cart_items:
            product = products.get(cart_item.product_id)
            if not product:
                stock_errors[str(cart_item.id)] = 'Product is no longer available.'
                continue
            if cart_item.qty > product.countInStock:
                stock_errors[str(cart_item.id)] = (
                    f'Only {product.countInStock} item(s) are available for '
                    f'{product.product_name}.'
                )
                continue

            unit_price = get_effective_price(product)
            line_total = money(unit_price * cart_item.qty)
            original_total = money(Decimal(product.product_price) * cart_item.qty)
            subtotal += line_total
            discount_amount += original_total - line_total
            prepared_items.append((cart_item, product, unit_price, line_total))

        if stock_errors:
            return Response({'stock': stock_errors}, status=status.HTTP_400_BAD_REQUEST)

        shipping_fee = Decimal('0.00')
        tax_amount = Decimal('0.00')
        total_amount = money(subtotal + shipping_fee + tax_amount)

        order = Order.objects.create(
            user=request.user,
            subtotal=money(subtotal),
            shipping_fee=shipping_fee,
            tax_amount=tax_amount,
            discount_amount=money(discount_amount),
            total_amount=total_amount,
            **shipping_payload,
        )

        order_items = []
        for cart_item, product, unit_price, line_total in prepared_items:
            order_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.product_name,
                    brand=product.brand,
                    unit_price=unit_price,
                    qty=cart_item.qty,
                    line_total=line_total,
                )
            )
            product.countInStock -= cart_item.qty
            product.save(update_fields=['countInStock'])

        OrderItem.objects.bulk_create(order_items)
        CartUser.objects.filter(user=request.user).delete()

    serializer = OrderSerializer(
        Order.objects.prefetch_related('items__product').get(id=order.id)
    )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = (
            Order.objects.filter(user=request.user)
            .prefetch_related('items__product')
            .get(id=pk)
        )
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def wishlist(request):
    if request.method == 'GET':
        items = WishlistItem.objects.filter(user=request.user).select_related('product')
        serializer = WishlistItemSerializer(items, many=True)
        return Response(serializer.data)

    product = get_product(request.data.get('product_id'))
    if not product:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    wishlist_item, created = WishlistItem.objects.get_or_create(
        user=request.user,
        product=product,
    )
    serializer = WishlistItemSerializer(wishlist_item)
    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_wishlist_item(request, product_id):
    deleted_count, _ = WishlistItem.objects.filter(
        user=request.user,
        product_id=product_id,
    ).delete()

    if not deleted_count:
        return Response(
            {'error': 'Wishlist item not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({'message': 'Product removed from wishlist.'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def product_reviews(request, product_id):
    product = get_product(product_id)
    if not product:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        reviews = (
            ProductReview.objects.filter(product=product, is_visible=True)
            .select_related('user', 'user__profile')
            .order_by('-createdAt')
        )
        serializer = ProductReviewSerializer(reviews, many=True)
        rating_summary = reviews.aggregate(average=Avg('rating'))
        has_reviewed = (
            request.user.is_authenticated
            and ProductReview.objects.filter(user=request.user, product=product).exists()
        )

        return Response(
            {
                'reviews': serializer.data,
                'average_rating': round(rating_summary['average'], 1)
                if rating_summary['average']
                else 0,
                'review_count': reviews.count(),
                'can_review': user_can_review_product(request.user, product)
                and not has_reviewed,
                'has_reviewed': has_reviewed,
            }
        )

    if ProductReview.objects.filter(user=request.user, product=product).exists():
        return Response(
            {'error': 'You already reviewed this product.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user_can_review_product(request.user, product):
        return Response(
            {'error': 'Only delivered buyers can review this product.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = ProductReviewSerializer(data=request.data)
    if serializer.is_valid():
        review = serializer.save(user=request.user, product=product)
        return Response(
            ProductReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    UserProfile.objects.get_or_create(user=request.user)
    serializer = MeSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsBusinessUser])
def business_dashboard_summary(request):
    owned_product_ids = get_business_product_ids(request)
    owned_items = OrderItem.objects.filter(product_id__in=owned_product_ids).exclude(
        order__status=Order.STATUS_CANCELLED
    )
    orders_query = (
        Order.objects.filter(items__product_id__in=owned_product_ids)
        .exclude(status=Order.STATUS_CANCELLED)
        .distinct()
    )
    total_sales = owned_items.aggregate(total=Sum('line_total'))['total'] or Decimal(
        '0.00'
    )
    low_stock_products = get_business_products_queryset(request).filter(
        is_active=True,
        countInStock__lte=5,
    )
    recent_orders = (
        orders_query.select_related('user')
        .prefetch_related('items__product')
        .order_by('-createdAt')[:5]
    )
    recent_reviews = (
        ProductReview.objects.filter(product_id__in=owned_product_ids)
        .select_related('product', 'user', 'user__profile')
        .order_by('-createdAt')[:5]
    )
    top_products = list(
        owned_items.values('product_id', 'product_name', 'brand')
        .annotate(total_qty=Sum('qty'), revenue=Sum('line_total'))
        .order_by('-total_qty')[:5]
    )

    return Response(
        {
            'total_sales': str(total_sales),
            'total_orders': orders_query.count(),
            'pending_orders': orders_query.filter(status=Order.STATUS_PENDING).count(),
            'delivered_orders': orders_query.filter(
                status=Order.STATUS_DELIVERED
            ).count(),
            'active_buyers': User.objects.filter(
                orders__items__product_id__in=owned_product_ids,
                is_active=True,
                is_superuser=False,
                profile__role=UserProfile.ROLE_BUYER,
            )
            .distinct()
            .count(),
            'low_stock_count': low_stock_products.count(),
            'recent_orders': BusinessOrderSerializer(
                recent_orders,
                many=True,
                context={'request': request},
            ).data,
            'recent_reviews': BusinessProductReviewSerializer(
                recent_reviews,
                many=True,
            ).data,
            'inventory_alerts': ProdctSerializer(low_stock_products[:8], many=True).data,
            'top_products': [
                {
                    'product_id': item['product_id'],
                    'product_name': item['product_name'],
                    'brand': item['brand'],
                    'total_qty': item['total_qty'],
                    'revenue': str(item['revenue'] or Decimal('0.00')),
                }
                for item in top_products
            ],
        }
    )


@api_view(['GET', 'POST'])
@permission_classes([IsBusinessUser])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def business_products(request):
    if request.method == 'GET':
        products = get_business_products_queryset(request)
        query = request.query_params

        search = query.get('search', '').strip()
        if search:
            products = products.filter(
                Q(product_name__icontains=search)
                | Q(brand__icontains=search)
                | Q(category__icontains=search)
                | Q(description__icontains=search)
            )

        category = query.get('category', '').strip()
        if category:
            products = products.filter(category__iexact=category)

        stock = query.get('stock', '').strip()
        if stock == 'low':
            products = products.filter(countInStock__lte=5)
        elif stock == 'out':
            products = products.filter(countInStock__lte=0)
        elif stock == 'active':
            products = products.filter(is_active=True)
        elif stock == 'archived':
            products = products.filter(is_active=False)

        products = products.order_by('-createdAt', 'product_name')
        return Response(ProdctSerializer(products, many=True).data)

    serializer = ProdctSerializer(data=request.data)
    if serializer.is_valid():
        if request.user.is_superuser:
            product = serializer.save()
        else:
            product = serializer.save(owner=request.user)
        return Response(ProdctSerializer(product).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsBusinessUser])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def business_product_detail(request, pk):
    try:
        product = get_business_products_queryset(request).get(id=pk)
    except Prodct.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        product.is_active = False
        product.save(update_fields=['is_active'])
        return Response({'message': 'Product archived.'})

    if request.method == 'PATCH':
        serializer = ProdctSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(ProdctSerializer(product).data)


@api_view(['GET'])
@permission_classes([IsBusinessUser])
def business_orders(request):
    orders_query = (
        get_business_orders_queryset(request)
        .select_related('user')
        .prefetch_related('items__product')
        .order_by('-createdAt')
    )
    order_status = request.query_params.get('status', '').strip()
    payment_status = request.query_params.get('payment_status', '').strip()

    if order_status:
        orders_query = orders_query.filter(status=order_status)
    if payment_status:
        orders_query = orders_query.filter(payment_status=payment_status)

    serializer = BusinessOrderSerializer(
        orders_query,
        many=True,
        context={'request': request},
    )
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsBusinessUser])
def business_order_detail(request, pk):
    try:
        order = (
            get_business_orders_queryset(request)
            .select_related('user')
            .prefetch_related('items__product')
            .get(id=pk)
        )
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'PATCH':
        item_id = request.data.get('item_id')
        fulfillment_status = request.data.get('fulfillment_status')
        valid_statuses = {
            choice[0] for choice in OrderItem.FULFILLMENT_STATUS_CHOICES
        }

        if not item_id or not fulfillment_status:
            return Response(
                {
                    'error': (
                        'Provide item_id and fulfillment_status to update an '
                        'owned order item.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if fulfillment_status not in valid_statuses:
            return Response(
                {'fulfillment_status': 'Choose a valid fulfillment status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        owned_items = order.items.select_related('product')
        if not request.user.is_superuser:
            owned_items = owned_items.filter(product__owner=request.user)

        try:
            order_item = owned_items.get(id=item_id)
        except (OrderItem.DoesNotExist, TypeError, ValueError):
            return Response(
                {'error': 'Order item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        order_item.fulfillment_status = fulfillment_status
        order_item.save(update_fields=['fulfillment_status'])
        return Response(
            BusinessOrderSerializer(order, context={'request': request}).data
        )

    return Response(BusinessOrderSerializer(order, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsBusinessUser])
def business_customers(request):
    owned_product_ids = get_business_product_ids(request)
    customers = User.objects.filter(
        orders__items__product_id__in=owned_product_ids,
        is_superuser=False,
        profile__role=UserProfile.ROLE_BUYER,
    ).select_related('profile').distinct()
    search = request.query_params.get('search', '').strip()
    if search:
        customers = customers.filter(
            Q(username__icontains=search)
            | Q(email__icontains=search)
            | Q(profile__full_name__icontains=search)
            | Q(profile__display_name__icontains=search)
        )
    return Response(
        BusinessCustomerSerializer(
            customers,
            many=True,
            context={'owned_product_ids': owned_product_ids},
        ).data
    )


@api_view(['GET', 'PATCH'])
@permission_classes([IsBusinessUser])
def business_customer_detail(request, pk):
    owned_product_ids = get_business_product_ids(request)
    try:
        customer = User.objects.filter(
            orders__items__product_id__in=owned_product_ids,
            id=pk,
            is_superuser=False,
            profile__role=UserProfile.ROLE_BUYER,
        ).select_related('profile').distinct().get()
    except User.DoesNotExist:
        return Response(
            {'error': 'Customer not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'PATCH':
        if 'is_active' in request.data:
            customer.is_active = parse_bool(request.data.get('is_active'))
            customer.save(update_fields=['is_active'])
        return Response(
            BusinessCustomerSerializer(
                customer,
                context={'owned_product_ids': owned_product_ids},
            ).data
        )

    return Response(
        BusinessCustomerSerializer(
            customer,
            context={'owned_product_ids': owned_product_ids},
        ).data
    )


@api_view(['GET'])
@permission_classes([IsBusinessUser])
def business_reviews(request):
    reviews = ProductReview.objects.filter(
        product_id__in=get_business_product_ids(request)
    ).select_related(
        'product',
        'user',
        'user__profile',
    ).order_by('-createdAt')
    visible = request.query_params.get('visible', '').strip().lower()
    rating = request.query_params.get('rating', '').strip()
    search = request.query_params.get('search', '').strip()

    if visible in ['true', '1', 'yes']:
        reviews = reviews.filter(is_visible=True)
    elif visible in ['false', '0', 'no']:
        reviews = reviews.filter(is_visible=False)
    if rating:
        reviews = reviews.filter(rating=rating)
    if search:
        reviews = reviews.filter(
            Q(product__product_name__icontains=search)
            | Q(user__username__icontains=search)
            | Q(comment__icontains=search)
        )

    return Response(BusinessProductReviewSerializer(reviews, many=True).data)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsBusinessUser])
def business_review_detail(request, pk):
    try:
        review = ProductReview.objects.filter(
            product_id__in=get_business_product_ids(request)
        ).select_related(
            'product',
            'user',
            'user__profile',
        ).get(id=pk)
    except ProductReview.DoesNotExist:
        return Response(
            {'error': 'Review not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        review.is_visible = False
    elif 'is_visible' in request.data:
        review.is_visible = parse_bool(request.data.get('is_visible'))

    review.save(update_fields=['is_visible'])
    return Response(BusinessProductReviewSerializer(review).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        return Response(user_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'PATCH':
        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile_photo(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'DELETE':
        if profile.profile_photo:
            profile.profile_photo.delete(save=True)
        return Response({'message': 'Profile photo removed.'})

    previous_photo = profile.profile_photo.name if profile.profile_photo else None
    serializer = ProfilePhotoSerializer(
        profile,
        data=request.data,
        context={'request': request},
    )
    if serializer.is_valid():
        serializer.save()
        if previous_photo and previous_photo != profile.profile_photo.name:
            profile.profile_photo.storage.delete(previous_photo)
        return Response(
            UserProfileSerializer(profile, context={'request': request}).data
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def change_password(request):
    serializer = PasswordChangeSerializer(
        data=request.data,
        context={'request': request},
    )
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Password updated successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
