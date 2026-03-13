# function-based views
from apps.task.models import Category, Subtask, Task
from django.db import models as db_models
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import (
    CategorySerializer,
    SubtaskSerializer,
    SubtaskUpdateSerializer,
    TaskMoveSerializer,
    TaskSerializer,
)


@api_view(["GET"])
def APIRoot(request):
    return Response(
        {
            "version 1": {
                "categories": request.build_absolute_uri("categories/"),
                "tasks": request.build_absolute_uri("tasks/"),
            }
        }
    )


def get_task(pk):
    try:
        return Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return None


# ------------------------------------------------------------
# Categories endpoints
# ------------------------------------------------------------


@api_view(["GET", "POST"])
def CategoryList(request):
    if request.method == "GET":
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def CategoryDetail(request, pk):
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response(status=404)

    if request.method == "GET":
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = CategorySerializer(
            category, data=request.data, partial=(request.method == "PATCH")
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        category.delete()
        return Response(status=204)


# ------------------------------------------------------------
# Tasks endpoints
# ------------------------------------------------------------


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def TaskDetail(request, pk):
    task = get_task(pk)
    if task is None:
        return Response(status=404)

    if request.method == "GET":
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    if request.method in ["PUT", "PATCH"]:
        serializer = TaskSerializer(
            task, data=request.data, partial=(request.method == "PATCH")
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    if request.method == "DELETE":
        task.delete()
        return Response(status=204)


@api_view(["GET", "POST"])
def TaskList(request):
    if request.method == "GET":
        tasks = Task.objects.select_related("category").all()

        # Add filtering like v2
        status = request.query_params.get("status")
        if status:
            tasks = tasks.filter(status=status)

        priority = request.query_params.get("priority")
        if priority:
            tasks = tasks.filter(priority=priority)

        category = request.query_params.get("category")
        if category:
            tasks = tasks.filter(category_id=category)

        ordering = request.query_params.get("ordering", "status")
        if ordering in ["status", "priority", "created_at"]:
            tasks = tasks.order_by(ordering, "-created_at")

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["POST"])
def TaskMove(request, pk):
    from .serializers import TaskMoveSerializer

    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(status=404)

    serializer = TaskMoveSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    new_status = serializer.validated_data["status"]
    new_position = serializer.validated_data.get("position", 0)

    with transaction.atomic():
        old_status = task.status
        old_position = task.position

        if new_status != old_status:
            Task.objects.filter(status=old_status, position__gt=old_position).update(
                position=db_models.F("position") - 1
            )
            Task.objects.filter(status=new_status, position__gte=new_position).update(
                position=db_models.F("position") + 1
            )

        task.status = new_status
        task.position = new_position
        task.save()

    return Response(TaskSerializer(task).data, status=200)


@api_view(["GET"])
def TaskByStatus(request, status=None):
    """Get tasks grouped by status (for Kanban board)"""
    # Validate status parameter
    valid_statuses = ["TODO", "IN_PROGRESS", "DONE", "ALL"]
    if status is None or status.upper() not in valid_statuses:
        return Response(
            {"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=400
        )

    try:
        tasks = Task.objects.select_related("category").all()
        if status == "all":
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
            return Response(result, status=200)
        else:
            serializer = TaskSerializer(
                tasks.filter(status=status.upper()).order_by("position"), many=True
            )
            return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": "Failed to retrieve tasks", "Details": str(e)}, status=500
        )


# ------------------------------------------------------------
# Subtasks endpoints
# ------------------------------------------------------------


@api_view(["GET", "POST"])
def SubtaskList(request, task_pk):
    """Get or create subtasks for a specific task"""
    try:
        task = Task.objects.get(pk=task_pk)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    if request.method == "GET":
        subtasks = task.subtasks.all().order_by("position", "created_at")
        serializer = SubtaskSerializer(subtasks, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        # Get the next position
        max_position = task.subtasks.count()
        serializer = SubtaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, position=max_position)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def SubtaskDetail(request, pk):
    """Get, update, or delete a specific subtask"""
    try:
        subtask = Subtask.objects.get(pk=pk)
    except Subtask.DoesNotExist:
        return Response({"error": "Subtask not found"}, status=404)

    if request.method == "GET":
        serializer = SubtaskSerializer(subtask)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = SubtaskSerializer(
            subtask, data=request.data, partial=(request.method == "PATCH")
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        subtask.delete()
        return Response(status=204)
