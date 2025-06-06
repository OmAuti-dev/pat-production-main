import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!dbUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    const project = await db.project.findUnique({
      where: { id: params.projectId },
      include: {
        User: {
          select: {
            clerkId: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check authorization
    if (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER') {
      const isTeamMember = project.User.some(user => user.clerkId === userId);
      if (!isTeamMember) {
        return new NextResponse('Unauthorized', { status: 403 });
      }
    }

    return NextResponse.json({ employees: project.User });
  } catch (error) {
    console.error('[PROJECTS_GET_EMPLOYEES]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId } = await req.json();

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const project = await db.project.update({
      where: { id: params.projectId },
      data: {
        User: {
          connect: { clerkId: employeeId }
        }
      },
      include: {
        User: {
          select: {
            clerkId: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    return NextResponse.json({ employees: project.User });
  } catch (error) {
    console.error('[PROJECTS_ADD_EMPLOYEE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 