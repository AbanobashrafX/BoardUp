from django.urls import path

from .views import (
    APIRoot,
    CategoryDetail,
    CategoryList,
    ProjectDetail,
    ProjectList,
    SubtaskDetail,
    SubtaskList,
    TaskByStatus,
    TaskDetail,
    TaskList,
    TaskMove,
)

urlpatterns = [
    path("", APIRoot, name="api-root"),
    # Projects
    path("projects/", ProjectList, name="project-list"),
    path("projects/<int:pk>/", ProjectDetail, name="project-detail"),
    # Categories
    path("categories/", CategoryList, name="category-list"),
    path("categories/<int:pk>/", CategoryDetail, name="category-detail"),
    # Tasks
    path("tasks/", TaskList, name="task-list"),
    path("tasks/<int:pk>/", TaskDetail, name="task-detail"),
    path("tasks/<int:pk>/move/", TaskMove, name="task-move"),
    path("tasks/<str:status>/", TaskByStatus, name="task-by-status"),
    # Subtasks
    path("tasks/<int:task_pk>/subtasks/", SubtaskList, name="subtask-list"),
    path("subtasks/<int:pk>/", SubtaskDetail, name="subtask-detail"),
]
