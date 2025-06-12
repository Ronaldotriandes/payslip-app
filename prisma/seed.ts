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
        'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
        'William', 'Jennifer', 'James', 'Mary', 'Christopher', 'Patricia', 'Daniel',
        'Linda', 'Matthew', 'Elizabeth', 'Anthony', 'Barbara', 'Mark', 'Susan',
        'Donald', 'Jessica', 'Steven', 'Margaret', 'Paul', 'Dorothy', 'Andrew',
        'Lisa', 'Joshua', 'Nancy', 'Kenneth', 'Karen', 'Kevin', 'Betty', 'Brian',
        'Helen', 'George', 'Sandra', 'Timothy', 'Donna', 'Ronald', 'Carol',
        'Jason', 'Ruth', 'Edward', 'Sharon', 'Jeffrey', 'Michelle'
    ]

    const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
        'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
        'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
        'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
        'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
        'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
        'Carter', 'Roberts'
    ]

    for (let i = 1; i <= 100; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const fullName = `${firstName} ${lastName}`
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`
        const email = `${username}@company.com`

        const baseSalary = Math.floor(Math.random() * 5000) + 3000
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
            name: 'January 2024',
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
