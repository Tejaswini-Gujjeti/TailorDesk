
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, report_summary

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")

urlpatterns = [
    path("reports/summary/", report_summary, name="report-summary"),
    *router.urls,
]
