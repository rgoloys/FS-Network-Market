from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import parser_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .models import CartUser, Prodct, UserProfile
from .serializers import (
    CartUserSerializer,
    PasswordChangeSerializer,
    ProdctSerializer,
    ProfilePhotoSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)
from rest_framework.response import Response


def parse_qty(value):
    try:
        qty = int(value)
    except (TypeError, ValueError):
        return None

    if qty < 1:
        return None

    return qty


@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    products = Prodct.objects.all()
    serializer = ProdctSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_by_id(request, pk):
    try:
        product = Prodct.objects.get(id=pk)
    except Prodct.DoesNotExist:
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

    try:
        product = Prodct.objects.get(id=product_id)
    except (Prodct.DoesNotExist, TypeError, ValueError):
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    cart_item, created = CartUser.objects.get_or_create(
        user=request.user,
        product=product,
    )

    if created:
        cart_item.qty = qty
    else:
        cart_item.qty += qty

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
        cart_item = CartUser.objects.get(id=pk, user=request.user)
    except CartUser.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    cart_item.qty = qty
    cart_item.save()
    serializer = CartUserSerializer(cart_item)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def read_cart(request):
    cart_items = CartUser.objects.filter(user=request.user)
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
