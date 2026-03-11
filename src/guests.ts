export interface Guest {
  id: string;
  name: string;
  pin: string;
  role?: string;
  avatar?: string;
  phrase?: string;
  hasConfirmed?: boolean;
  priority?: number;
}

export const guestList: Guest[] = [
  { id: "guest_1", name: "Іван Шестопал", pin: "K9X2P", role: "Наречений", avatar: "/IVAN.png", phrase: "Чекаю на наше свято!", hasConfirmed: false, priority: 1 },
  { id: "guest_2", name: "Марія (поки ще) Загуліна", pin: "M4V7A", role: "Наречена", avatar: "/MARIA.png", phrase: "Нарешті цей день настане!", hasConfirmed: false, priority: 2 },
  { id: "guest_3", name: "Марина Велітченко", pin: "R8D3W", role: "Ведуча", avatar: "/MARYNA.png", phrase: "Зробимо це свято незабутнім!", hasConfirmed: false, priority: 3 },
  { id: "guest_4", name: "Євгеній Субота", pin: "T5L9C", role: "Дружба", phrase: "Готовий підтримувати нареченого і наливати!", hasConfirmed: false, priority: 4 },
  { id: "guest_5", name: "Аліса Храпова", pin: "B2N6E", role: "Дружка", phrase: "Слідкую, щоб макіяж нареченої був ідеальним!", hasConfirmed: false, priority: 5 },
  { id: "guest_6", name: "Олександр Шестопал", pin: "H7F4Y", role: "Батько нареченого", phrase: "Пишаюся сином!", hasConfirmed: false },
  { id: "guest_7", name: "Вадим Загулін", pin: "Q3J8K", role: "Батько нареченої", phrase: "Віддаю донечку в надійні руки!", hasConfirmed: false },
  { id: "guest_8", name: "Оксана Шестопал", pin: "W6M2R", role: "Мати нареченого", phrase: "Чекаю на онуків, але спочатку погуляємо!", hasConfirmed: false },
  { id: "guest_9", name: "Тетяна Загуліна", pin: "P9C5T", role: "Мати нареченої", phrase: "Найщасливіша мама найкрасивішої нареченої!", hasConfirmed: false },
  { id: "guest_10", name: "Денис Шестопал", pin: "A4X7D", role: "Брат нареченого", phrase: "Братику, ти попав... на найкраще свято!", hasConfirmed: false },
  { id: "guest_11", name: "Валерія Шендрик", pin: "E8V3N", role: "Любима невістка нареченого", phrase: "Вже обираю сукню і готую тости!", hasConfirmed: false },
  { id: "guest_12", name: "Андрій Загулін", pin: "L2B9H", role: "Брат нареченої", phrase: "Буду пильнувати, щоб усе пройшло ідеально!", hasConfirmed: false },
  { id: "guest_13", name: "Валерія", pin: "Y5K6F", phrase: "Готова танцювати до ранку!", hasConfirmed: false },
  { id: "guest_14", name: "Андрій Дягонець", pin: "C7R4M", role: "Дядько нареченого", phrase: "Заряджений на позитив і гучні тости!", hasConfirmed: false },
  { id: "guest_15", name: "Світлана Дягонець", pin: "D3T8P", role: "Тітка нареченого", phrase: "Несу радість, посмішки і подарунки!", hasConfirmed: false },
  { id: "guest_16", name: "Анастасія Звягінцева", pin: "N6A2X", role: "Любимий сеструн нареченого", phrase: "Сестринська любов і підтримка гарантовані!", hasConfirmed: false },
  { id: "guest_17", name: "Андрій Звягінцев", pin: "V9E5W", role: "Любимий зять нареченого", phrase: "Готовий до святкування на всі 100%!", hasConfirmed: false },
  { id: "guest_18", name: "Єва Звягінцева", pin: "J4L7B", role: "Любима племінниця нареченого", phrase: "Буду наймилішою гостею на весіллі!", hasConfirmed: false },
  { id: "guest_19", name: "Тарас Звягінцев", pin: "F8H3Q", role: "Любимий племінник нареченого", phrase: "Чекаю на смачний торт!", hasConfirmed: false },
  { id: "guest_20", name: "Павло Шестопал", pin: "X2Y9C", role: "Дядько нареченого", phrase: "Готую найкращі побажання молодятам!", hasConfirmed: false },
  { id: "guest_21", name: "Алла Шестопал", pin: "K5M6D", role: "Тітка нареченого", phrase: "З нетерпінням чекаю на це світле свято!", hasConfirmed: false },
  { id: "guest_22", name: "Ольга Курунтяєва", pin: "R7V4T", role: "Тітка нареченої", phrase: "Будемо гуляти так, щоб запам'яталося назавжди!", hasConfirmed: false },
  { id: "guest_23", name: "Валерій Дороган", pin: "P3N8A", role: "Дядько нареченої", phrase: "Підтримую будь-який кіпіш, крім голодування!", hasConfirmed: false },
  { id: "guest_24", name: "Софія Дороган", pin: "W9F2E", role: "Любима сестричка нареченої", phrase: "Вже вчу рухи для танцполу!", hasConfirmed: false },
  { id: "guest_25", name: "Анна Борщ", pin: "H4C7L", role: "Тітка нареченої", phrase: "Готую хустинку для сліз радості!", hasConfirmed: false },
  { id: "guest_26", name: "Юрій Пузанков", pin: "T8X3J", role: "Дядько нареченої", phrase: "Завжди за гарну компанію і свято!", hasConfirmed: false },
  { id: "guest_27", name: "Олександр Маслов", pin: "M2D9R", role: "Хрещений нареченої", phrase: "Хрещениця виросла, час святкувати!", hasConfirmed: false },
  { id: "guest_28", name: "Анна Маслова", pin: "B5K6P", role: "Хрещена нареченої", phrase: "Моя дівчинка виходить заміж!", hasConfirmed: false },
  { id: "guest_29", name: "Nataliya Krasauskiene", pin: "A7W4N", role: "Хрещена нареченої", phrase: "З любов'ю та найкращими побажаннями!", hasConfirmed: false },
  { id: "guest_30", name: "Галина Лемішко", pin: "E3Y8V", role: "Хрещена нареченого", phrase: "Благословляю на щасливе сімейне життя!", hasConfirmed: false },
  { id: "guest_31", name: "Юрій Кононенко", pin: "L6H2F", role: "Хрещений нареченого", phrase: "Хрещеник, ти зробив правильний вибір!", hasConfirmed: false },
  { id: "guest_32", name: "Валентина Кононенко", pin: "Q9R5C", role: "Хрещена нареченого", phrase: "Нехай ваше кохання квітне з кожним днем!", hasConfirmed: false },
  { id: "guest_33", name: "Ірина Радченко", pin: "D4M7X", role: "Подружка нареченої", phrase: "Готова ловити букет!", hasConfirmed: false },
  { id: "guest_34", name: "Домінік", pin: "N8T3B", phrase: "Заряджений на веселу вечірку!", hasConfirmed: false },
  { id: "guest_35", name: "Артем Гапонець", pin: "V2A9K", role: "Друг сім'ї", phrase: "Сім'я — це головне, радий бути з вами!", hasConfirmed: false },
  { id: "guest_36", name: "Катерина Чала", pin: "J5E6W", role: "Подруга нареченого", phrase: "Буду відриватися за двох!", hasConfirmed: false },
  { id: "guest_37", name: "Сергій Цюпка", pin: "F7P4L", role: "Друг нареченого", phrase: "Братан, вітаю з новим етапом!", hasConfirmed: false },
  { id: "guest_38", name: "Валерія Бурнакова", pin: "X3C8H", role: "Подружка нареченого", phrase: "Бажаю море кохання і океан щастя!", hasConfirmed: false },
  { id: "guest_39", name: "Любов Дягонець", pin: "K6Y2D", role: "Бабуся нареченого", phrase: "Молюся за ваше щастя, мої рідні!", hasConfirmed: false },
  { id: "guest_40", name: "Євгеній Загулін", pin: "R9N5T", role: "Дідусь нареченої", phrase: "Онучко, будь найщасливішою!", hasConfirmed: false },
  { id: "guest_41", name: "Любов Пузанкова", pin: "P4F7M", role: "Бабуся нареченої", phrase: "Чекаю на правнуків, але не кваплю!", hasConfirmed: false },
  { id: "guest_42", name: "Володимир Пузанков", pin: "W8J3A", role: "Дідусь нареченої", phrase: "Хай у вашому домі завжди лунає сміх!", hasConfirmed: false },
];
