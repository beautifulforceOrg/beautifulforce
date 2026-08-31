import { db, type OrderStatus, type Prisma } from "@storeforge/db";

export interface OrderFilters {
  status?: OrderStatus;
  search?: string; // matches customer email/name or gatewayOrderId
  fromDate?: string; // ISO date
  toDate?: string; // ISO date
}

export async function listOrders(filters: OrderFilters = {}) {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.fromDate || filters.toDate) {
    where.createdAt = {
      ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
      ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
    };
  }
  if (filters.search) {
    const search = filters.search.trim();
    where.OR = [
      { gatewayOrderId: { contains: search, mode: "insensitive" } },
      { shipToName: { contains: search, mode: "insensitive" } },
      { shipToEmail: { contains: search, mode: "insensitive" } },
      { customer: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  return db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true, customer: { select: { email: true } } },
  });
}

export async function getOrderDetail(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, variant: true } },
      customer: { select: { email: true, name: true } },
    },
  });
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await db.order.update({ where: { id }, data: { status } });
}
