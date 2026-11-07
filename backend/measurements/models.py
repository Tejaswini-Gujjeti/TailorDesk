
from django.db import models
from customers.models import Customer
from orders.models import Order


class Measurement(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="measurements",
    )
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="measurement",
    )

    chest = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    waist = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    shoulder = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    blouse_length = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sleeve_length = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sleeve_round = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    armhole = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    neck_depth = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Measurements for {self.customer.name} - Order #{self.order_id}"
