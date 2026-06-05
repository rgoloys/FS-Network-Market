from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Avg, Max, Min, Q
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
)
from .serializers import (
    CartUserSerializer,
    OrderSerializer,
    PasswordChangeSerializer,
    ProdctSerializer,
    ProductReviewSerializer,
    ProfilePhotoSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
    WishlistItemSerializer,
)

MONEY_QUANTIZER = Decimal('0.01')


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


def money(value):
    return Decimal(value).quantize(MONEY_QUANTIZER)


def get_effective_price(product):
    price = Decimal(product.product_price or 0)
    discount = Decimal(product.discount_percent or 0)
    if discount <= 0:
        return money(price)
    return money(price * (Decimal('100') - discount) / Decimal('100'))


def get_product(pk):
    try:
        return Prodct.objects.get(id=pk)
    except (Prodct.DoesNotExist, TypeError, ValueError):
        return None


def get_cart_items(user):
    return CartUser.objects.select_related('product').filter(user=user)


def user_can_review_product(user, product):
    if not user.is_authenticated:
        return False

    return OrderItem.objects.filter(
        order__user=user,
        order__status=Order.STATUS_DELIVERED,
        product=product,
    ).exists()


@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    products = Prodct.objects.all()
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
    summary = Prodct.objects.aggregate(
        min_price=Min('product_price'),
        max_price=Max('product_price'),
    )
    brands = list(
        Prodct.objects.exclude(brand='')
        .order_by('brand')
        .values_list('brand', flat=True)
        .distinct()
    )
    categories = list(
        Prodct.objects.exclude(category='')
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
            ProductReview.objects.filter(product=product)
            .select_related('user', 'user__profile')
            .order_by('-createdAt')
        )
        serializer = ProductReviewSerializer(reviews, many=True)
        rating_summary = reviews.aggregate(average=Avg('rating'))
        has_reviewed = (
            request.user.is_authenticated
            and reviews.filter(user=request.user).exists()
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
