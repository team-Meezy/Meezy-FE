export const sidebarList: {
  team_id: number;
  room_name: string;
  type: 'ROOM' | 'MEMBER' | null;
  create_at: null;
}[] = [
  {
    team_id: 1,
    room_name: '대화',
    type: 'ROOM',
    create_at: null,
  },
  {
    team_id: 2,
    room_name: '멤버',
    type: 'MEMBER',
    create_at: null,
  },
];

export const roomsrcList = [
  {
    room_id: 1,
    team_id: 1,
    room_name: '환영',
    create_at: null,
  },
  {
    room_id: 2,
    team_id: 1,
    room_name: '잡담',
    create_at: null,
  },
];

export const userList = [
  {
    user_id: 1,
    team_id: 2,
    user_name: '정명우',
    create_at: null,
    img: null,
  },
  {
    user_id: 2,
    team_id: 2,
    user_name: '김효현',
    create_at: null,
    img: null,
  },
];
