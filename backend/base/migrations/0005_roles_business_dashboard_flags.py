# Generated for role-aware dashboards and business moderation flags.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def create_missing_buyer_profiles(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('base', 'UserProfile')

    for user in User.objects.all():
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'buyer'},
        )


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0004_core_ecommerce_features'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='prodct',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='productreview',
            name='is_visible',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('buyer', 'Buyer'),
                    ('business_admin', 'Business admin'),
                ],
                default='buyer',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='user',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='profile',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(
            create_missing_buyer_profiles,
            migrations.RunPython.noop,
        ),
    ]
