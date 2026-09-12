import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma, Student } from "@prisma/client";
import Image from "next/image";

import { auth } from "@/auth";

type ParentList = Parent & { students: Student[] };

const fallbackParents: ParentList[] = [
  {
    id: "parent1",
    username: "parent1",
    name: "Amina",
    surname: "Khan",
    email: "amina.khan@example.com",
    phone: "+1234567890",
    address: "12 River Road",
    createdAt: new Date(),
    students: [
      {
        id: "student1",
        username: "student1",
        name: "Zaid",
        surname: "Khan",
        email: "zaid.khan@example.com",
        phone: "+1987654321",
        address: "12 River Road",
        img: null,
        bloodType: "O+",
        sex: "MALE",
        createdAt: new Date(),
        parentId: "parent1",
        classId: 1,
        gradeId: 1,
        birthday: new Date(),
      },
    ],
  },
  {
    id: "parent2",
    username: "parent2",
    name: "Nadia",
    surname: "Osei",
    email: "nadia.osei@example.com",
    phone: "+1555666777",
    address: "99 Hill Avenue",
    createdAt: new Date(),
    students: [
      {
        id: "student2",
        username: "student2",
        name: "Mariam",
        surname: "Osei",
        email: "mariam.osei@example.com",
        phone: "+1444333222",
        address: "99 Hill Avenue",
        img: null,
        bloodType: "A-",
        sex: "FEMALE",
        createdAt: new Date(),
        parentId: "parent2",
        classId: 1,
        gradeId: 1,
        birthday: new Date(),
      },
    ],
  },
  {
    id: "parent3",
    username: "parent3",
    name: "James",
    surname: "Baker",
    email: "james.baker@example.com",
    phone: "+1666777888",
    address: "77 Market Street",
    createdAt: new Date(),
    students: [],
  },
] as ParentList[];

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const params = await searchParams;
  const session = await auth();
  const role = session?.user?.role;


  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student Names",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
      : []),
  ];

  const renderRow = (item: ParentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.students.map((student) => student.name).join(",")}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="parent" type="update" data={item} />
              <FormContainer table="parent" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = params;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ParentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  let data: ParentList[] = fallbackParents;
  let count = fallbackParents.length;

  try {
    const result = await prisma.$transaction([
      prisma.parent.findMany({
        where: query,
        include: {
          students: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.parent.count({ where: query }),
    ]);

    data = result[0] as ParentList[];
    count = result[1];
  } catch (error) {
    console.error("Failed to load parents from the database. Showing fallback demo data.", error);
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Parents</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="parent" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ParentListPage;
