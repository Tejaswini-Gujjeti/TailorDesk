

from django.db import models
from customers.models import Customer


class Order(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("In Progress", "In Progress"),
        ("Ready for Delivery", "Ready for Delivery"),
        ("Delivered", "Delivered"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    garment = models.CharField(max_length=100, default="Blouse")
    description = models.TextField(blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="Pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.garment} - {self.customer.name}"

    class Meta:
        ordering = ["delivery_date", "-created_at"]
