import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log(' Starting seed...')

    const hashedAdminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            password: hashedAdminPassword,
            role: UserRole.ADMIN,
        },
    })
    console.log('Created admin user')

    const employees: any = []
    const firstNames = [
        'Ahmad', 'Siti', 'Budi', 'Andi', 'Dewi', 'Rudi', 'Sri', 'Agus',
        'Indra', 'Maya', 'Dedi', 'Rina', 'Hadi', 'Lina', 'Joko', 'Sari',
        'Bambang', 'Fitri', 'Eko', 'Dian', 'Wawan', 'Yuni', 'Tono', 'Ratna',
        'Hendra', 'Novi', 'Doni', 'Ika', 'Reza', 'Ayu', 'Fajar', 'Mega',
        'Rizki', 'Putri', 'Adi', 'Wulan', 'Bayu', 'Sinta', 'Dimas', 'Lia',
        'Arif', 'Nita', 'Yoga', 'Tari', 'Iman', 'Dina', 'Feri', 'Rini',
        'Gilang', 'Siska'
    ]

    const lastNames = [
        'Pratama', 'Sari', 'Wijaya', 'Kusuma', 'Santoso', 'Wati', 'Putra', 'Dewi',
        'Setiawan', 'Lestari', 'Nugroho', 'Anggraini', 'Hidayat', 'Maharani', 'Saputra', 'Permata',
        'Gunawan', 'Safitri', 'Kurniawan', 'Rahayu', 'Sutrisno', 'Handayani', 'Firmansyah', 'Puspita',
        'Hermawan', 'Cahyani', 'Suryanto', 'Melati', 'Hakim', 'Kartika', 'Ramadhan', 'Indah',
        'Maulana', 'Sartika', 'Firdaus', 'Pertiwi', 'Syahputra', 'Utami', 'Rahman', 'Ningrum',
        'Adiputra', 'Safira', 'Mahendra', 'Arimbi', 'Nugraha', 'Kusumawati', 'Prabowo', 'Maharani',
        'Wibowo', 'Damayanti'
    ]

    const salaryRanges = [
        { min: 1000000, max: 3000000 },
        { min: 3000000, max: 6000000 },
        { min: 6000000, max: 10000000 },
    ]

    for (let i = 1; i <= 100; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const fullName = `${firstName} ${lastName}`
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`
        const email = `${username}@company.com`

        const salaryRange = salaryRanges[Math.floor(Math.random() * salaryRanges.length)]
        const baseSalary = Math.floor(Math.random() * (salaryRange.max - salaryRange.min + 1)) + salaryRange.min
        const hourlyRate = Math.round((baseSalary / 160) * 100) / 100

        const hashedPassword = await bcrypt.hash(`password${i}`, 10)

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: UserRole.EMPLOYEE,
                employee: {
                    create: {
                        fullname: fullName,
                        email,
                        baseSalary,
                        hourlyRate,
                        overtimeRate: 1.5,
                    },
                },
            },
            include: {
                employee: true,
            },
        })

        employees.push(user.employee)

        if (i % 10 === 0) {
            console.log(`Created ${i} employees`)
        }
    }

    console.log('Created 100 employees')

    await prisma.attendancePeriod.create({
        data: {
            name: 'Januari 2024',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            status: 'ACTIVE',
        },
    })

    console.log('Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
