
from django.db import models
from django.contrib.auth.models import User


class Customer(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="customers",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.phone}"

    class Meta:
        ordering = ["name"]


# This stores each customer once, allowing the same customer to have multiple blouse orders.
