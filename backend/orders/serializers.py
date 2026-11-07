
from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name", read_only=True
    )
    customer_phone = serializers.CharField(
        source="customer.phone", read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_phone",
            "garment",
            "description",
            "delivery_date",
            "charge",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
