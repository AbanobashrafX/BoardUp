from django.db import models as db_models
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.task.models import Category, Task
from .serializers import (
    CategorySerializer,
    TaskCreateSerializer,
    TaskMoveSerializer,
    TaskSerializer,
)


class CategoryViewSet(ModelViewSet):
    """
    ViewSet for Category CRUD operations
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    # disable pagination
    pagination_class = None

    def get_queryset(self):
        """Optionally filter by name"""
        queryset = Category.objects.all()
        name = self.request.query_params.get("name")
        if name:
            queryset = queryset.filter(name__icontains=name)
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response


class TaskViewSet(ModelViewSet):
    """
    ViewSet for Task CRUD operations with drag-and-drop support
    """

    queryset = Task.objects.select_related("category").all()
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == "create":
            return TaskCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        """Filter tasks by various parameters"""
        queryset = Task.objects.select_related("category").all()

        # Filter by status
        task_status = self.request.query_params.get("status")
        if task_status:
            queryset = queryset.filter(status=task_status)

        # Filter by priority
        priority = self.request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)

        return queryset

    def perform_create(self, serializer):
        """Auto-set position when creating a task"""
        # Get the highest position in the current status
        status_value = serializer.validated_data.get("status", "TODO")
        max_position = (
            Task.objects.filter(status=status_value).aggregate(
                max_pos=db_models.Max("position")
            )["max_pos"]
            or -1
        )

        serializer.save(position=max_position + 1)

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        """
        Move task to different status/position (for drag-and-drop)
        """
        task = self.get_object()
        serializer = TaskMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        new_position = serializer.validated_data.get("position", 0)

        with transaction.atomic():
            old_status = task.status
            old_position = task.position

            if new_status != old_status:
                # Update positions of tasks in old status
                Task.objects.filter(
                    status=old_status, position__gt=old_position
                ).update(position=db_models.F("position") - 1)

                # Update positions of tasks in new status
                Task.objects.filter(
                    status=new_status, position__gte=new_position
                ).update(position=db_models.F("position") + 1)

            task.status = new_status
            task.position = new_position
            task.save()

        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def by_status(self, request):
        """
        Get tasks grouped by status for Kanban board
        """
        tasks = self.get_queryset()
        result = {
            "TODO": TaskSerializer(
                tasks.filter(status="TODO").order_by("position"), many=True
            ).data,
            "IN_PROGRESS": TaskSerializer(
                tasks.filter(status="IN_PROGRESS").order_by("position"), many=True
            ).data,
            "DONE": TaskSerializer(
                tasks.filter(status="DONE").order_by("position"), many=True
            ).data,
        }
        return Response(result, status=status.HTTP_200_OK)
