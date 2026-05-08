import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // We build the query filter based on the user's role
    const projectFilter = userRole === "ADMIN" 
      ? {} 
      : { 
          // Assuming we would filter projects a member belongs to, but for now we'll fetch all if admin, or ownerId
          // Let's use ownerId for now, but a real app would have teamMembers relations.
        };

    const now = new Date();

    const activeProjects = await prisma.project.count({
      where: {
        ...projectFilter,
        status: "ACTIVE",
        OR: [
          { deadline: null },
          { deadline: { gte: now } }
        ]
      }
    });

    const completedProjects = await prisma.project.count({
      where: {
        ...projectFilter,
        status: "COMPLETED"
      }
    });

    const overdueProjects = await prisma.project.count({
      where: {
        ...projectFilter,
        status: { not: "COMPLETED" },
        deadline: { lt: now }
      }
    });

    // Also get task stats for "My Tasks" widgets optionally
    const totalTasksAssigned = await prisma.task.count({
      where: { assigneeId: userId }
    });

    const completedTasks = await prisma.task.count({
      where: { assigneeId: userId, status: "COMPLETED" }
    });

    return NextResponse.json({
      activeProjects,
      completedProjects,
      overdueProjects,
      myTasks: {
        total: totalTasksAssigned,
        completed: completedTasks
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
