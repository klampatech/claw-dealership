import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAlternatives, createAlternative } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    category: searchParams.get('category') || undefined,
    security: searchParams.get('security') || undefined,
    deployment: searchParams.get('deployment') || undefined,
    hardware: searchParams.get('hardware') || undefined,
    useCase: searchParams.get('useCase') || undefined,
    search: searchParams.get('search') || undefined,
  };

  try {
    const alternatives = getAlternatives(filters);
    return NextResponse.json(alternatives);
  } catch (error) {
    console.error('Failed to fetch alternatives:', error);
    return NextResponse.json({ error: 'Failed to fetch alternatives' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      name,
      description,
      fullDescription,
      githubUrl,
      language,
      category,
      security,
      deployment,
      hardware,
      useCases,
      features,
    } = body;

    const id = createAlternative({
      name,
      description,
      fullDescription,
      githubUrl,
      language,
      category,
      security,
      deployment: deployment || [],
      hardware: hardware || [],
      useCases: useCases || [],
      features: features || [],
      submittedBy: session.user?.name || 'anonymous',
    });

    return NextResponse.json({ id, message: 'Submission received' });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
