
from rest_framework import serializers
from .models import Measurement


class MeasurementSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:
        model = Measurement
        fields = [
            "id",
            "customer",
            "customer_name",
            "order",
            "chest",
            "waist",
            "shoulder",
            "blouse_length",
            "sleeve_length",
            "sleeve_round",
            "armhole",
            "neck_depth",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
