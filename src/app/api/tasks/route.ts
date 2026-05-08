import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let whereClause: any = {};
    
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    // If not admin, maybe only see tasks assigned to them? Or see all tasks in projects they are part of.
    // For simplicity, let's allow seeing all tasks, but members can only edit their own status.

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allowed all users to create tasks
    // Removed role check to match frontend behavior

    const body = await req.json();
    const { title, description, priority, dueDate, projectId, assigneeId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: "Title and Project are required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
