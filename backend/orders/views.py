
from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.select_related("customer").filter(
            customer__owner=self.request.user
        )

    def perform_create(self, serializer):
        customer = serializer.validated_data["customer"]

        if customer.owner_id != self.request.user.id:
            raise ValidationError({
                "customer": "You cannot create an order for another tailor's customer."
            })

        serializer.save()

    def perform_update(self, serializer):
        customer = serializer.validated_data.get(
            "customer",
            serializer.instance.customer,
        )

        if customer.owner_id != self.request.user.id:
            raise ValidationError({
                "customer": "You cannot assign an order to another tailor's customer."
            })

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()

        try:
            self.perform_destroy(order)
        except ProtectedError:
            return Response(
                {
                    "error": (
                        "This order cannot be deleted because it has "
                        "recorded payments. Please preserve the payment "
                        "history or use an order cancellation option."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
