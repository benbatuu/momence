import { PrismaClient, Role, PackageType, Discipline, ServiceType, ClassStatus, BookingStatus, AttendanceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // Temizlik (Önceki verileri temizle)
  await prisma.auditLog.deleteMany();
  await prisma.errorLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.classTemplate.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.workshopTicket.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.onDemandVideo.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.clientPackage.deleteMany();
  await prisma.package.deleteMany();
  await prisma.instructorPayout.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.studio.deleteMany();

  const commonPassword = await bcrypt.hash('123456', 10);

  // 1. SUPER_ADMIN (SaaS Platform Sahibi)
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Batuhan Küçük (SaaS Admin)',
      email: 'superadmin@momence-tr.com',
      password: commonPassword,
      role: Role.SUPER_ADMIN,
      studioId: null,
      isActive: true,
    },
  });
  console.log('✅ SUPER_ADMIN oluşturuldu:', superAdmin.email);

  // 2. ÖRNEK STÜDYO (OM Pilates)
  const studio = await prisma.studio.create({
    data: {
      name: 'OM Pilates & Yoga Studio',
      subdomain: 'om-pilates',
      phone: '+905551112233',
      address: 'Kadıköy, İstanbul',
      currency: 'TRY',
      isActive: true,
    },
  });
  console.log('✅ Stüdyo oluşturuldu:', studio.name);

  // 3. STÜDYO KULLANICILARI (Admin, Eğitmenler, Müşteri)
  const studioAdmin = await prisma.user.create({
    data: {
      studioId: studio.id,
      name: 'Merve Yılmaz (Stüdyo Sahibi)',
      email: 'admin@ompilates.com',
      password: commonPassword,
      role: Role.ADMIN,
      phone: '+905320000001',
      isActive: true,
    },
  });

  const instructor1 = await prisma.user.create({
    data: {
      studioId: studio.id,
      name: 'Ece Kaya',
      email: 'ece@ompilates.com',
      password: commonPassword,
      role: Role.INSTRUCTOR,
      phone: '+905320000002',
      specialties: [Discipline.PILATES, Discipline.REFORMER],
      bio: '10 yıllık Reformer Pilates ve Klinik Pilates uzmanı.',
      isActive: true,
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      studioId: studio.id,
      name: 'Can Demir',
      email: 'can@ompilates.com',
      password: commonPassword,
      role: Role.INSTRUCTOR,
      phone: '+905320000003',
      specialties: [Discipline.YOGA, Discipline.BARRE],
      bio: 'Vinyasa Yoga ve Barre Master Trainer.',
      isActive: true,
    },
  });

  const client = await prisma.user.create({
    data: {
      studioId: studio.id,
      name: 'Zeynep Şahin',
      email: 'client@example.com',
      password: commonPassword,
      role: Role.CLIENT,
      phone: '+905320000004',
      isActive: true,
    },
  });
  console.log('✅ Kullanıcılar (Admin, Eğitmenler, Müşteri) oluşturuldu.');

  // 4. PAKET ŞABLONLARI
  const package1 = await prisma.package.create({
    data: {
      studioId: studio.id,
      name: "10'lu Reformer Paket",
      type: PackageType.CREDIT_PACK,
      creditCount: 10,
      price: 4500,
      validityDays: 60,
      allowedDisciplines: [Discipline.PILATES, Discipline.REFORMER],
      allowedServices: [ServiceType.CLASS],
      isOnlineSaleAllowed: true,
      isActive: true,
    },
  });

  const package2 = await prisma.package.create({
    data: {
      studioId: studio.id,
      name: 'Sınırsız Aylık Yoga Üyeliği',
      type: PackageType.UNLIMITED,
      creditCount: -1,
      price: 3200,
      validityDays: 30,
      allowedDisciplines: [Discipline.YOGA],
      allowedServices: [ServiceType.CLASS],
      isOnlineSaleAllowed: true,
      isActive: true,
    },
  });
  console.log('✅ Paket şablonları oluşturuldu.');

  // 5. MÜŞTERİYE PAKET TANIMLAMA & ÖDEME
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + 60);

  const clientPackage = await prisma.clientPackage.create({
    data: {
      studioId: studio.id,
      userId: client.id,
      packageId: package1.id,
      creditsTotal: 10,
      creditsUsed: 1,
      pricePaid: 4500,
      expiresAt,
      isActive: true,
    },
  });

  await prisma.payment.create({
    data: {
      studioId: studio.id,
      userId: client.id,
      clientPackageId: clientPackage.id,
      amount: 4500,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.SUCCESS,
      invoiceNo: 'INV-2026-001',
    },
  });
  console.log('✅ Müşteriye paket tanımlandı ve ödeme kaydı açıldı.');

  // 6. DERS ŞABLONLARI & CANLI DERS SEANSI
  const templateReformer = await prisma.classTemplate.create({
    data: {
      studioId: studio.id,
      title: 'Reformer Flow Level 1',
      description: 'Temel pilates prensipleriyle omurga sağlığı ve güçlenme.',
      discipline: Discipline.REFORMER,
      durationMin: 50,
      maxCapacity: 8,
      level: 'Beginner',
      isActive: true,
    },
  });

  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 2); // 2 saat sonra
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 50);

  const session = await prisma.classSession.create({
    data: {
      studioId: studio.id,
      templateId: templateReformer.id,
      instructorId: instructor1.id,
      title: 'Reformer Flow Level 1',
      description: 'Temel reformer dersi.',
      location: 'Studio Reformer A',
      startTime,
      endTime,
      capacity: 8,
      status: ClassStatus.SCHEDULED,
    },
  });

  // Müşteriyi Derse Kaydet
  const booking = await prisma.booking.create({
    data: {
      sessionId: session.id,
      userId: client.id,
      clientPackageId: clientPackage.id,
      status: BookingStatus.CONFIRMED,
    },
  });
  console.log('✅ Ders şablonu, canlı seans ve üye rezervasyonu oluşturuldu.');

  // 7. ON-DEMAND VİDEO KÜTÜPHANESİ
  await prisma.onDemandVideo.create({
    data: {
      studioId: studio.id,
      title: 'Sabah Esnemesi & Omurga Mobilizasyonu',
      description: 'Güne enerjik başlamak için 15 dakikalık mat pilates serisi.',
      videoUrl: 'https://cdn.ompilates.com/videos/morning-flow.mp4',
      thumbnailUrl: 'https://cdn.ompilates.com/images/morning-flow.jpg',
      durationSec: 900,
      discipline: Discipline.PILATES,
      isRequiredPackage: true,
      isActive: true,
    },
  });

  // 8. POS MAĞAZA ÜRÜNLERİ
  await prisma.product.createMany({
    data: [
      {
        studioId: studio.id,
        name: 'OM Pilates Kaydırmaz Çorap',
        price: 350,
        stock: 50,
        isActive: true,
      },
      {
        studioId: studio.id,
        name: 'Pro Premium Yoga Mat 6mm',
        price: 1200,
        stock: 15,
        isActive: true,
      },
    ],
  });
  console.log('✅ On-demand video ve POS mağaza ürünleri oluşturuldu.');

  console.log('🚀 Seed işlemi başarıyla tamamlandı!');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });