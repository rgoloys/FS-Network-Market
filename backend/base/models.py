from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.utils import timezone

class Prodct(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='business_products',
    )
    product_name = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    brand = models.CharField(max_length=255)
    category = models.CharField(max_length=120, default='Network Hardware')
    description = models.TextField()
    countInStock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
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
    FULFILLMENT_PENDING = 'pending'
    FULFILLMENT_PROCESSING = 'processing'
    FULFILLMENT_SHIPPED = 'shipped'
    FULFILLMENT_DELIVERED = 'delivered'
    FULFILLMENT_CANCELLED = 'cancelled'

    FULFILLMENT_STATUS_CHOICES = [
        (FULFILLMENT_PENDING, 'Pending'),
        (FULFILLMENT_PROCESSING, 'Processing'),
        (FULFILLMENT_SHIPPED, 'Shipped'),
        (FULFILLMENT_DELIVERED, 'Delivered'),
        (FULFILLMENT_CANCELLED, 'Cancelled'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Prodct, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    brand = models.CharField(max_length=255, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    fulfillment_status = models.CharField(
        max_length=20,
        choices=FULFILLMENT_STATUS_CHOICES,
        default=FULFILLMENT_PENDING,
    )

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
    is_visible = models.BooleanField(default=True)
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
    ROLE_BUYER = 'buyer'
    ROLE_BUSINESS_ADMIN = 'business_admin'

    ROLE_CHOICES = [
        (ROLE_BUYER, 'Buyer'),
        (ROLE_BUSINESS_ADMIN, 'Business admin'),
    ]

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
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default=ROLE_BUYER,
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


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

class paymentMethod(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order = models.OneToOneField(
        Order,
        on_delete=models.SET_NULL,
        related_name='payment_record',
        null=True,
        blank=True,
    )
    totalPrice = models.DecimalField(max_digits=10, decimal_places=2)
    isPaid = models.BooleanField(default=False)
    paidAt = models.DateTimeField(null=True, blank=True)
    # Xendit returns this ID after we create the hosted checkout invoice.
    # We keep it so webhook events can be matched back to our local order.
    xendit_invoice_id = models.CharField(max_length=255, blank=True, default='')
    # external_id is our own unique reference sent to Xendit.
    # It is safer for reconciliation because we control the value.
    xendit_external_id = models.CharField(max_length=255, blank=True, default='', db_index=True)
    # Store the latest Xendit status we have seen, such as PENDING, PAID, or EXPIRED.
    xendit_status = models.CharField(max_length=50, blank=True, default='PENDING')

    def mark_paid(self):
        """Mark this payment and its linked order as paid.

        Xendit can send duplicate webhook events, so this method is intentionally
        idempotent.
        """
        with transaction.atomic():
            payment = type(self).objects.select_for_update().get(id=self.id)
            if payment.isPaid:
                self.isPaid = payment.isPaid
                self.paidAt = payment.paidAt
                self.xendit_status = payment.xendit_status
                return

            payment.isPaid = True
            payment.paidAt = timezone.now()
            payment.xendit_status = 'PAID'
            payment.save(update_fields=['isPaid', 'paidAt', 'xendit_status'])

            if payment.order_id:
                order = Order.objects.select_for_update().get(id=payment.order_id)
                order.payment_status = Order.PAYMENT_PAID
                if order.status == Order.STATUS_PENDING:
                    order.status = Order.STATUS_PROCESSING
                order.save(update_fields=['payment_status', 'status', 'updatedAt'])

            self.isPaid = payment.isPaid
            self.paidAt = payment.paidAt
            self.xendit_status = payment.xendit_status

    def __str__(self):
        return f'Payment #{self.id} - {self.user.username}'


class shippingAddress(models.Model):
    paymentId = models.ForeignKey(paymentMethod, on_delete=models.CASCADE)
    fullName = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    postalCode = models.CharField(max_length=255)
    country = models.CharField(max_length=255)

    def __str__(self):
        return f'{self.fullName} - {self.city}'
