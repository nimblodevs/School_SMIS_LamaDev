import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { requirePageUser } from "@/lib/authorization";

type SubjectList = Subject & { teachers: Teacher[] };

const fallbackSubjects: SubjectList[] = [
  { id: 1, name: "Mathematics", teachers: [{ id: "teacher1", name: "TName1", surname: "TSurname1", username: "teacher1", email: null, phone: null, address: "Address1", img: null, bloodType: "A+", sex: "MALE", createdAt: new Date(), birthday: new Date() }] },
  { id: 2, name: "Science", teachers: [{ id: "teacher1", name: "TName1", surname: "TSurname1", username: "teacher1", email: null, phone: null, address: "Address1", img: null, bloodType: "A+", sex: "MALE", createdAt: new Date(), birthday: new Date() }] },
  { id: 3, name: "English", teachers: [] },
  { id: 4, name: "History", teachers: [] },
  { id: 5, name: "Geography", teachers: [] },
  { id: 6, name: "Physics", teachers: [] },
  { id: 7, name: "Chemistry", teachers: [] },
  { id: 8, name: "Biology", teachers: [] },
  { id: 9, name: "Computer Science", teachers: [] },
  { id: 10, name: "Art", teachers: [] },
] as SubjectList[];

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const params = await searchParams;
  const user = await requirePageUser(["admin"]);
  const role = user.role;

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Teachers",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: SubjectList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">
        {item.teachers?.map((teacher) => teacher.name).join(",") || "-"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="subject" type="update" data={item} />
              <FormContainer table="subject" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = params;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.SubjectWhereInput = {};

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

  let data: SubjectList[] = fallbackSubjects;
  let count = fallbackSubjects.length;

  try {
    const result = await prisma.$transaction([
      prisma.subject.findMany({
        where: query,
        include: {
          teachers: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.subject.count({ where: query }),
    ]);

    data = result[0] as SubjectList[];
    count = result[1];
  } catch (error) {
    console.error("Failed to load subjects from the database. Showing fallback demo data.", error);
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="subject" type="create" />
            )}
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

export default SubjectListPage;
