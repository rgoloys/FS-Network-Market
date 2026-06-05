from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Prodct(models.Model):
    product_name = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    brand = models.CharField(max_length=255)
    category = models.CharField(max_length=120, default='Network Hardware')
    description = models.TextField()
    countInStock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.product_name


class CartUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Prodct, on_delete=models.CASCADE)
    qty = models.IntegerField(default=1)

    def __str__(self):
        return f'{self.user.username} - {self.product.product_name}'


class Order(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_SHIPPED = 'shipped'
    STATUS_DELIVERED = 'delivered'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_SHIPPED, 'Shipped'),
        (STATUS_DELIVERED, 'Delivered'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    PAYMENT_PENDING = 'pending'
    PAYMENT_PAID = 'paid'
    PAYMENT_FAILED = 'failed'
    PAYMENT_REFUNDED = 'refunded'

    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_PENDING, 'Pending'),
        (PAYMENT_PAID, 'Paid'),
        (PAYMENT_FAILED, 'Failed'),
        (PAYMENT_REFUNDED, 'Refunded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_PENDING,
    )
    shipping_full_name = models.CharField(max_length=255)
    shipping_email = models.EmailField()
    shipping_phone_number = models.CharField(max_length=30)
    shipping_country = models.CharField(max_length=100)
    shipping_city_province = models.CharField(max_length=150)
    shipping_address = models.TextField()
    shipping_postal_code = models.CharField(max_length=30)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Order #{self.id} - {self.user.username}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Prodct, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    brand = models.CharField(max_length=255, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f'{self.product_name} x {self.qty}'


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Prodct, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'product'],
                name='unique_user_wishlist_product',
            )
        ]

    def __str__(self):
        return f'{self.user.username} saved {self.product.product_name}'


class ProductReview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Prodct, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'product'],
                name='unique_user_product_review',
            )
        ]

    def __str__(self):
        return f'{self.product.product_name} review by {self.user.username}'


class UserProfile(models.Model):
    GENDER_CHOICES = [
        ('female', 'Female'),
        ('male', 'Male'),
        ('non_binary', 'Non-binary'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    full_name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        null=True,
        blank=True,
    )
    country = models.CharField(max_length=100, blank=True)
    city_province = models.CharField(max_length=150, blank=True)
    address = models.TextField(blank=True)
    postal_code = models.CharField(max_length=30, blank=True)
    security_question = models.CharField(max_length=255, blank=True)
    security_answer_hash = models.CharField(max_length=255, blank=True)
    language_preference = models.CharField(max_length=50, default='en', blank=True)
    time_zone = models.CharField(max_length=100, default='UTC', blank=True)
    bio = models.TextField(blank=True)
    interests = models.JSONField(default=list, blank=True)
    occupation_school = models.CharField(max_length=255, blank=True)
    social_links = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f'{self.user.username} profile'
