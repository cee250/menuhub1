import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { businessId, customerName, rating, comment } = await req.json();

    if (!businessId || !customerName || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        businessId,
        customerName,
        rating: Number(rating),
        comment,
        isApproved: false, // Requires restaurant/admin approval
        isVerified: false,
      },
    });

    return NextResponse.json({ success: true, review });
    } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const approvedOnly = searchParams.get('approvedOnly') !== 'false';

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        businessId,
        ...(approvedOnly ? { isApproved: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

    const breakdown = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        breakdown,
      },
    });
    } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { reviewId, isApproved, action } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    if (action === 'delete') {
      await prisma.review.delete({ where: { id: reviewId } });
      return NextResponse.json({ success: true, message: 'Review deleted' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved },
    });

    return NextResponse.json({ success: true, review: updated });
    } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
