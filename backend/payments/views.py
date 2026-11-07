
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Payment
from .serializers import PaymentSerializer
from datetime import date

from django.db.models import Sum, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from orders.models import Order

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.select_related(
            "order",
            "order__customer",
        ).filter(
            order__customer__owner=self.request.user
        )

    def perform_create(self, serializer):
        order = serializer.validated_data["order"]

        if order.customer.owner_id != self.request.user.id:
            raise ValidationError({
                "order": "You cannot add a payment to another tailor's order."
            })

        serializer.save()



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_summary(request):
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    if not start_date or not end_date:
        return Response(
            {"error": "Both start_date and end_date are required."},
            status=400,
        )

    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        return Response(
            {"error": "Dates must use YYYY-MM-DD format."},
            status=400,
        )

    if start > end:
        return Response(
            {"error": "From Date cannot be after To Date."},
            status=400,
        )

    user_orders = Order.objects.filter(
        customer__owner=request.user,
        created_at__date__range=(start, end),
    )

    user_payments = Payment.objects.filter(
        order__customer__owner=request.user,
        payment_date__date__range=(start, end),
    )

    order_summary = user_orders.aggregate(
        total_orders=Count("id"),
        total_order_value=Sum("charge"),
    )

    payment_summary = user_payments.aggregate(
        total_payments=Count("id"),
        total_received=Sum("amount"),
    )

    return Response({
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "total_orders": order_summary["total_orders"] or 0,
        "total_order_value": order_summary["total_order_value"] or 0,
        "total_payments": payment_summary["total_payments"] or 0,
        "total_received": payment_summary["total_received"] or 0,
    })
