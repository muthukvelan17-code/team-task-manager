import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const body = await req.json();
    
    // Admins can update anything.
    // Members can only update the status of tasks assigned to them.
    if (session.user.role !== "ADMIN") {
      if (task.assigneeId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden. You can only update tasks assigned to you." }, { status: 403 });
      }
      
      // Member can only update status
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status: body.status }
      });
      return NextResponse.json(updatedTask);
    }

    // Admin can update all fields
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : task.title,
        description: body.description !== undefined ? body.description : task.description,
        status: body.status !== undefined ? body.status : task.status,
        priority: body.priority !== undefined ? body.priority : task.priority,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : task.dueDate,
        assigneeId: body.assigneeId !== undefined ? body.assigneeId : task.assigneeId,
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
