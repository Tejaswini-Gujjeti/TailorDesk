
from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="order.customer.name",
        read_only=True
    )

    garment = serializers.CharField(
        source="order.garment",
        read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "customer_name",
            "garment",
            "amount",
            "payment_date",
            "notes",
        ]
        read_only_fields = ["id", "payment_date"]
