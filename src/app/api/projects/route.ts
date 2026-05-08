import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allowed all authenticated users to create projects
    // Removed role check to match frontend behavior

    const { name, description, priority, status, deadline, memberIds } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        priority: priority || "MEDIUM",
        status: status || "ACTIVE",
        deadline: deadline ? new Date(deadline) : null,
        ownerId: session.user.id,
        members: {
          connect: memberIds && Array.isArray(memberIds) 
            ? memberIds.map((id: string) => ({ id })) 
            : [{ id: session.user.id }] // Owner is member by default
        }
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
