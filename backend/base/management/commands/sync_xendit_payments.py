import urllib.error

from django.core.management.base import BaseCommand, CommandError

from base.models import Order, paymentMethod
from base.views import (
    XENDIT_FAILED_STATUSES,
    XENDIT_PAID_STATUSES,
    get_xendit_invoice,
)


class Command(BaseCommand):
    help = 'Synchronize pending local Xendit invoice payments with Xendit.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--payment-id',
            type=int,
            help='Only sync one local paymentMethod row.',
        )
        parser.add_argument(
            '--order-id',
            type=int,
            help='Only sync the paymentMethod row linked to one order.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would change without updating the database.',
        )

    def handle(self, *args, **options):
        payments = paymentMethod.objects.select_related('order').filter(
            xendit_invoice_id__gt='',
        )

        if options['payment_id']:
            payments = payments.filter(id=options['payment_id'])
        if options['order_id']:
            payments = payments.filter(order_id=options['order_id'])
        if not options['payment_id'] and not options['order_id']:
            payments = payments.filter(isPaid=False)

        total = payments.count()
        updated = 0
        skipped = 0
        failed = 0

        self.stdout.write(f'Checking {total} Xendit payment(s)...')

        for payment in payments:
            try:
                invoice = get_xendit_invoice(payment.xendit_invoice_id)
            except RuntimeError as error:
                raise CommandError(str(error)) from error
            except urllib.error.HTTPError as error:
                failed += 1
                body = error.read().decode('utf-8', errors='replace')
                self.stderr.write(
                    f'Payment #{payment.id}: Xendit returned HTTP {error.code}: {body}'
                )
                continue
            except urllib.error.URLError as error:
                failed += 1
                self.stderr.write(f'Payment #{payment.id}: Xendit request failed: {error}')
                continue

            xendit_status = str(invoice.get('status', '')).upper()
            invoice_id = invoice.get('id') or payment.xendit_invoice_id
            external_id = invoice.get('external_id') or payment.xendit_external_id
            prefix = (
                f'Payment #{payment.id} order #{payment.order_id} '
                f'invoice {invoice_id} status={xendit_status or "UNKNOWN"}'
            )

            if xendit_status in XENDIT_PAID_STATUSES:
                if options['dry_run']:
                    self.stdout.write(f'[dry-run] Would mark paid: {prefix}')
                else:
                    payment.mark_paid()
                    self.stdout.write(f'Marked paid: {prefix}')
                updated += 1
                continue

            if xendit_status in XENDIT_FAILED_STATUSES:
                if options['dry_run']:
                    self.stdout.write(f'[dry-run] Would record closed status: {prefix}')
                else:
                    payment.xendit_status = xendit_status
                    payment.save(update_fields=['xendit_status'])
                    if payment.order_id and not payment.isPaid:
                        payment.order.payment_status = Order.PAYMENT_FAILED
                        payment.order.save(update_fields=['payment_status', 'updatedAt'])
                    self.stdout.write(f'Recorded closed status: {prefix}')
                updated += 1
                continue

            if not options['dry_run'] and xendit_status and payment.xendit_status != xendit_status:
                payment.xendit_status = xendit_status
                payment.save(update_fields=['xendit_status'])

            skipped += 1
            self.stdout.write(
                f'Skipped: {prefix} external_id={external_id or "not-returned"}'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. checked={total} updated={updated} skipped={skipped} failed={failed}'
            )
        )
