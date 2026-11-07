
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Measurement
from .serializers import MeasurementSerializer


class MeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = MeasurementSerializer

    def get_queryset(self):
        return Measurement.objects.select_related(
            "customer", "order"
        ).filter(
            customer__owner=self.request.user,
            order__customer__owner=self.request.user,
        )

    def validate_relationships(self, customer, order):
        if customer.owner_id != self.request.user.id:
            raise ValidationError({
                "customer": "You cannot use another tailor's customer."
            })

        if order.customer_id != customer.id:
            raise ValidationError({
                "order": "This order does not belong to the selected customer."
            })

        if order.customer.owner_id != self.request.user.id:
            raise ValidationError({
                "order": "You cannot use another tailor's order."
            })

    def perform_create(self, serializer):
        customer = serializer.validated_data["customer"]
        order = serializer.validated_data["order"]

        self.validate_relationships(customer, order)
        serializer.save()

    def perform_update(self, serializer):
        customer = serializer.validated_data.get(
            "customer", serializer.instance.customer
        )
        order = serializer.validated_data.get(
            "order", serializer.instance.order
        )

        self.validate_relationships(customer, order)
        serializer.save()
