import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0007_paymentmethod_shippingaddress'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentmethod',
            name='order',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='payment_record',
                to='base.order',
            ),
        ),
    ]
