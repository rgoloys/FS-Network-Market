from datetime import date
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import password_changed, validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Avg
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import (
    CartUser,
    Order,
    OrderItem,
    Prodct,
    ProductReview,
    UserProfile,
    WishlistItem,
)


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )
    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        UserProfile.objects.create(user=user)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProdctSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    sale_price = serializers.SerializerMethodField()

    class Meta:
        model = Prodct
        fields = [
            'id',
            'product_name',
            'product_price',
            'brand',
            'category',
            'description',
            'countInStock',
            'image',
            'is_featured',
            'discount_percent',
            'sale_price',
            'average_rating',
            'review_count',
            'createdAt',
        ]

    def get_average_rating(self, obj):
        rating = obj.reviews.aggregate(value=Avg('rating'))['value']
        return round(rating, 1) if rating else 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_sale_price(self, obj):
        discount = Decimal(obj.discount_percent or 0)
        price = Decimal(obj.product_price or 0)
        if discount <= 0:
            return str(price)
        sale_price = price * (Decimal('100') - discount) / Decimal('100')
        return str(sale_price.quantize(Decimal('0.01')))


class CartUserSerializer(serializers.ModelSerializer):
    product = ProdctSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartUser
        fields = [
            'id',
            'product',
            'product_id',
            'qty',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProdctSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'brand',
            'unit_price',
            'qty',
            'line_total',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'status',
            'payment_status',
            'shipping_full_name',
            'shipping_email',
            'shipping_phone_number',
            'shipping_country',
            'shipping_city_province',
            'shipping_address',
            'shipping_postal_code',
            'subtotal',
            'shipping_fee',
            'tax_amount',
            'discount_amount',
            'total_amount',
            'items',
            'createdAt',
            'updatedAt',
        ]
        read_only_fields = fields


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProdctSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'createdAt']


class ProductReviewSerializer(serializers.ModelSerializer):
    user_display_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = [
            'id',
            'rating',
            'comment',
            'user_display_name',
            'createdAt',
            'updatedAt',
        ]
        read_only_fields = ['id', 'user_display_name', 'createdAt', 'updatedAt']

    def get_user_display_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.display_name:
            return profile.display_name
        if profile and profile.full_name:
            return profile.full_name
        return obj.user.username

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', required=True)
    email = serializers.EmailField(source='user.email', required=True)
    profile_photo = serializers.ImageField(read_only=True)
    security_answer = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )
    current_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )
    security_answer_configured = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'username',
            'email',
            'full_name',
            'display_name',
            'phone_number',
            'date_of_birth',
            'gender',
            'profile_photo',
            'country',
            'city_province',
            'address',
            'postal_code',
            'security_question',
            'security_answer',
            'current_password',
            'security_answer_configured',
            'language_preference',
            'time_zone',
            'bio',
            'interests',
            'occupation_school',
            'social_links',
        ]

    def get_security_answer_configured(self, obj):
        return bool(obj.security_answer_hash)

    def validate_date_of_birth(self, value):
        if value and value > date.today():
            raise serializers.ValidationError('Date of birth cannot be in the future.')
        return value

    def validate_interests(self, value):
        if not isinstance(value, list) or not all(
            isinstance(item, str) for item in value
        ):
            raise serializers.ValidationError('Interests must be a list of text values.')
        return [item.strip() for item in value if item.strip()]

    def validate_social_links(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Social links must be a list.')

        url_field = serializers.URLField()
        cleaned_links = []
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    'Each social link must contain a label and URL.'
                )

            label = str(item.get('label', '')).strip()
            url = str(item.get('url', '')).strip()
            if not label or not url:
                raise serializers.ValidationError(
                    'Each social link must contain a label and URL.'
                )

            try:
                url = url_field.run_validation(url)
            except serializers.ValidationError as error:
                raise serializers.ValidationError(
                    f'{label} must use a valid URL.'
                ) from error

            cleaned_links.append({'label': label, 'url': url})

        return cleaned_links

    def validate(self, attrs):
        request = self.context['request']
        user_data = attrs.get('user', {})
        username = user_data.get('username')
        email = user_data.get('email')

        if username and User.objects.exclude(pk=request.user.pk).filter(
            username=username
        ).exists():
            raise serializers.ValidationError(
                {'username': 'A user with that username already exists.'}
            )

        if email and User.objects.exclude(pk=request.user.pk).filter(
            email__iexact=email
        ).exists():
            raise serializers.ValidationError(
                {'email': 'A user with that email already exists.'}
            )

        question_supplied = 'security_question' in self.initial_data
        answer = attrs.get('security_answer', '').strip()
        if question_supplied or answer:
            question = attrs.get(
                'security_question',
                self.instance.security_question,
            ).strip()
            current_password = attrs.get('current_password', '')

            if not question or not answer:
                raise serializers.ValidationError(
                    {
                        'security_question': (
                            'Provide both a security question and answer.'
                        )
                    }
                )

            if not current_password or not request.user.check_password(
                current_password
            ):
                raise serializers.ValidationError(
                    {'current_password': 'Your current password is incorrect.'}
                )

        return attrs

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        security_answer = validated_data.pop('security_answer', '')
        validated_data.pop('current_password', None)

        if user_data:
            user = instance.user
            for attribute, value in user_data.items():
                setattr(user, attribute, value)
            user.save(update_fields=list(user_data.keys()))

        if security_answer:
            instance.security_answer_hash = make_password(security_answer)

        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)

        instance.save()
        return instance


class ProfilePhotoSerializer(serializers.ModelSerializer):
    profile_photo = serializers.ImageField(required=True, allow_empty_file=False)

    class Meta:
        model = UserProfile
        fields = ['profile_photo']

    def validate_profile_photo(self, value):
        allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
        if value.content_type not in allowed_types:
            raise serializers.ValidationError('Use a JPG, PNG, or WebP image.')
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Profile photo must be 5 MB or smaller.')
        return value


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Your current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )

        try:
            validate_password(
                attrs['new_password'],
                user=self.context['request'].user,
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError(
                {'new_password': error.messages}
            ) from error

        return attrs

    def save(self):
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save(update_fields=['password'])
        password_changed(new_password, user=user)
        return user
