import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSuperAdminSessionToken } from '@/lib/super-admin';
import bcrypt from 'bcryptjs';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
}

function isAuthorized(request: NextRequest) {
  return isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      categories: {
        include: { items: true },
        orderBy: { sortOrder: 'asc' },
      },
      orders: true,
      gallery: true,
    },
  });

  return NextResponse.json(businesses.map(({ password: _password, ...business }) => business));
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json();
    const { name, slug, password, whatsappNumber, businessType, location, tier, status, showOnHomepage } = body || {};

    if (!name || !slug || !password || !whatsappNumber) {
      return NextResponse.json({ error: 'Name, slug, password, and WhatsApp number are required.' }, { status: 400 });
    }

    const cleanSlug = String(slug).toLowerCase().replace(/\s+/g, '-');
    const existing = await prisma.business.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json({ error: 'This business URL is already taken.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const business = await prisma.business.create({
      data: {
        name: String(name),
        slug: cleanSlug,
        password: hashedPassword,
        whatsappNumber: String(whatsappNumber),
        businessType: businessType ? String(businessType) : 'other',
        location: location ? String(location) : '',
        tier: tier ? String(tier) : 'ESSENTIALS',
        status: status ? String(status) : 'PENDING',
        activatedAt: status === 'ACTIVE' ? new Date() : null,
        showOnHomepage: Boolean(showOnHomepage),
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: 'super-admin',
        action: 'create_business',
        details: `Created business ${business.name}`,
        businessId: business.id,
      },
    });

    const { password: _password, ...safeBusiness } = business;
    return NextResponse.json(safeBusiness, { status: 201 });
  } catch (error) {
    console.error('Super admin business create failed:', error);
    return NextResponse.json({ error: 'Could not create business.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json();
    const { id, ids, ...updates } = body || {};

    if (ids && Array.isArray(ids)) {
      const payload: Record<string, any> = {};
      for (const key of ['status', 'showOnHomepage']) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          payload[key] = updates[key];
        }
      }

      // If activating, set activatedAt
      if (payload.status === 'ACTIVE') {
        payload.activatedAt = new Date();
      }

      const result = await prisma.business.updateMany({
        where: { id: { in: ids } },
        data: payload,
      });

      return NextResponse.json({ ok: true, updatedCount: result.count });
    }

    if (!id) {
      return NextResponse.json({ error: 'Business id is required.' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Business id is required.' }, { status: 400 });
    }

    const allowedUpdates = [
      'name',
      'slug',
      'whatsappNumber',
      'waiterCallNumber',
      'businessType',
      'location',
      'tier',
      'status',
      'themeColor',
      'hasFreeWifi',
      'showOnHomepage',
      'instagramUrl',
      'facebookUrl',
      'tiktokUrl',
      'password',
    ];

    const payload: Record<string, any> = {};
    for (const key of allowedUpdates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        payload[key] = updates[key];
      }
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    if (payload.slug) {
      const existing = await prisma.business.findFirst({
        where: {
          slug: payload.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'This business URL is already taken.' }, { status: 400 });
      }
    }

    // If status is being updated to ACTIVE, set activatedAt if not already set
    if (payload.status === 'ACTIVE') {
      const current = await prisma.business.findUnique({ where: { id }, select: { activatedAt: true } });
      if (!current?.activatedAt) {
        payload.activatedAt = new Date();
      }
    }

    const business = await prisma.business.update({
      where: { id },
      data: payload,
    });

    await prisma.auditLog.create({
      data: {
        actor: 'super-admin',
        action: 'update_business',
        details: `Updated business ${business.name}`,
        businessId: business.id,
      },
    });

    const { password: _password, ...safeBusiness } = business;
    return NextResponse.json(safeBusiness);
  } catch (error) {
    console.error('Super admin business update failed:', error);
    return NextResponse.json({ error: 'Could not update business.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json();
    const { id } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Business id is required.' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id }, select: { name: true } });
    await prisma.business.delete({ where: { id } });

    if (business) {
      await prisma.auditLog.create({
        data: {
          actor: 'super-admin',
          action: 'delete_business',
          details: `Deleted business ${business.name}`,
        },
      });
    }

    return NextResponse.json({ ok: true, message: 'Business deleted.' });
  } catch (error) {
    console.error('Super admin business delete failed:', error);
    return NextResponse.json({ error: 'Could not delete business.' }, { status: 500 });
  }
}
