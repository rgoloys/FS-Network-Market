# Generated for the FS Network Market core ecommerce expansion.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def categorize_existing_products(apps, schema_editor):
    Prodct = apps.get_model('base', 'Prodct')

    for product in Prodct.objects.all():
        text = f'{product.product_name} {product.description}'.lower()
        category = 'Network Hardware'
        if 'access point' in text or 'wireless' in text:
            category = 'Wireless Access Point'
        elif 'firewall' in text:
            category = 'Firewall'
        elif 'router' in text:
            category = 'Router'
        elif 'controller' in text:
            category = 'Controller'
        elif 'transceiver' in text:
            category = 'Transceiver'
        elif 'switch' in text:
            category = 'Switch'

        product.category = category
        product.is_featured = product.pk <= 10
        product.save(update_fields=['category', 'is_featured'])


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0003_userprofile'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='prodct',
            name='category',
            field=models.CharField(default='Network Hardware', max_length=120),
        ),
        migrations.AddField(
            model_name='prodct',
            name='discount_percent',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=5,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(100),
                ],
            ),
        ),
        migrations.AddField(
            model_name='prodct',
            name='is_featured',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            categorize_existing_products,
            migrations.RunPython.noop,
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('shipped', 'Shipped'), ('delivered', 'Delivered'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('payment_status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('failed', 'Failed'), ('refunded', 'Refunded')], default='pending', max_length=20)),
                ('shipping_full_name', models.CharField(max_length=255)),
                ('shipping_email', models.EmailField(max_length=254)),
                ('shipping_phone_number', models.CharField(max_length=30)),
                ('shipping_country', models.CharField(max_length=100)),
                ('shipping_city_province', models.CharField(max_length=150)),
                ('shipping_address', models.TextField()),
                ('shipping_postal_code', models.CharField(max_length=30)),
                ('subtotal', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('shipping_fee', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('discount_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('total_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(max_length=255)),
                ('brand', models.CharField(blank=True, max_length=255)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('qty', models.PositiveIntegerField()),
                ('line_total', models.DecimalField(decimal_places=2, max_digits=12)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='base.order')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='base.prodct')),
            ],
        ),
        migrations.CreateModel(
            name='WishlistItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='base.prodct')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wishlist', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'constraints': [models.UniqueConstraint(fields=('user', 'product'), name='unique_user_wishlist_product')],
            },
        ),
        migrations.CreateModel(
            name='ProductReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('comment', models.TextField(blank=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='base.prodct')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'constraints': [models.UniqueConstraint(fields=('user', 'product'), name='unique_user_product_review')],
            },
        ),
    ]
