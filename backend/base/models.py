from django.db import models
from django.contrib.auth.models import User

class Prodct(models.Model):
    product_name = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    brand = models.CharField(max_length=255)
    description = models.TextField()
    countInStock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.product_name


class CartUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Prodct, on_delete=models.CASCADE)
    qty = models.IntegerField(default=1)

    def __str__(self):
        return f'{self.user.username} - {self.product.product_name}'


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
