
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import ProtectedError

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        # Return only customers owned by the logged-in user.
        return Customer.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign new customers to the logged-in user.
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()

        try:
            self.perform_destroy(customer)
        except ProtectedError:
            return Response(
                {
                    "error": (
                        "This customer cannot be deleted because "
                        "they have existing orders. Please keep the "
                        "customer record to preserve order history."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
