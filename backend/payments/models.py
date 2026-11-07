
from django.db import models
from orders.models import Order


class Payment(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=250, blank=True)

    def __str__(self):
        return f"Payment of {self.amount} for Order #{self.order_id}"

    class Meta:
        ordering = ["-payment_date"]
