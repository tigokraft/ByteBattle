import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const questions = [
    // PSI - Programming/Software
    { category: "PSI", question: "Qual é a função principal de um Compilador?", options: JSON.stringify(["Traduzir código-fonte para código de máquina", "Executar hardware", "Limpar RAM"]), correctIndex: 0, difficulty: "medium" },
    { category: "PSI", question: "O que significa HTML?", options: JSON.stringify(["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language"]), correctIndex: 0, difficulty: "easy" },
    { category: "PSI", question: "Qual estrutura de dados usa LIFO?", options: JSON.stringify(["Fila", "Pilha", "Lista Ligada"]), correctIndex: 1, difficulty: "medium" },
    { category: "PSI", question: "O que é recursão?", options: JSON.stringify(["Uma função que chama a si mesma", "Um loop infinito", "Um tipo de variável"]), correctIndex: 0, difficulty: "easy" },
    { category: "PSI", question: "Qual a complexidade do Binary Search?", options: JSON.stringify(["O(n)", "O(log n)", "O(n²)"]), correctIndex: 1, difficulty: "hard" },
    { category: "PSI", question: "O que é um ORM?", options: JSON.stringify(["Object-Relational Mapping", "Online Resource Manager", "Open Runtime Module"]), correctIndex: 0, difficulty: "medium" },
    { category: "PSI", question: "Qual padrão de design usa 'getInstance()'?", options: JSON.stringify(["Factory", "Singleton", "Observer"]), correctIndex: 1, difficulty: "hard" },
    { category: "PSI", question: "O que é uma API REST?", options: JSON.stringify(["Interface de programação baseada em HTTP", "Linguagem de programação", "Banco de dados"]), correctIndex: 0, difficulty: "easy" },
    { category: "PSI", question: "Qual é o propósito do Git?", options: JSON.stringify(["Controle de versão", "Edição de texto", "Compilação de código"]), correctIndex: 0, difficulty: "easy" },
    { category: "PSI", question: "O que é polimorfismo em OOP?", options: JSON.stringify(["Herdar de múltiplas classes", "Mesma interface, diferentes implementações", "Esconder dados"]), correctIndex: 1, difficulty: "hard" },

    // MAT - Mathematics
    { category: "MAT", question: "Qual é a derivada de x²?", options: JSON.stringify(["2x", "x", "x²"]), correctIndex: 0, difficulty: "easy" },
    { category: "MAT", question: "Quanto é 15% de 200?", options: JSON.stringify(["25", "30", "35"]), correctIndex: 1, difficulty: "easy" },
    { category: "MAT", question: "Qual é o valor de π aproximadamente?", options: JSON.stringify(["3.14", "2.71", "1.62"]), correctIndex: 0, difficulty: "easy" },
    { category: "MAT", question: "Qual é a raiz quadrada de 144?", options: JSON.stringify(["10", "12", "14"]), correctIndex: 1, difficulty: "easy" },
    { category: "MAT", question: "O que é um número primo?", options: JSON.stringify(["Divisível apenas por 1 e ele mesmo", "Número par", "Número negativo"]), correctIndex: 0, difficulty: "easy" },
    { category: "MAT", question: "Qual é o limite de sen(x)/x quando x→0?", options: JSON.stringify(["0", "1", "∞"]), correctIndex: 1, difficulty: "hard" },
    { category: "MAT", question: "Quantos lados tem um dodecágono?", options: JSON.stringify(["10", "12", "15"]), correctIndex: 1, difficulty: "medium" },
    { category: "MAT", question: "Qual é o fatorial de 5 (5!)?", options: JSON.stringify(["60", "120", "150"]), correctIndex: 1, difficulty: "medium" },
    { category: "MAT", question: "O que é logaritmo natural (ln)?", options: JSON.stringify(["Log base 10", "Log base e", "Log base 2"]), correctIndex: 1, difficulty: "medium" },
    { category: "MAT", question: "Qual é a fórmula de Bhaskara?", options: JSON.stringify(["(-b±√(b²-4ac))/2a", "a²+b²=c²", "E=mc²"]), correctIndex: 0, difficulty: "hard" },

    // GAE - General/Geography
    { category: "GAE", question: "Qual é a capital de Portugal?", options: JSON.stringify(["Porto", "Lisboa", "Braga"]), correctIndex: 1, difficulty: "easy" },
    { category: "GAE", question: "Quantos continentes existem?", options: JSON.stringify(["5", "6", "7"]), correctIndex: 2, difficulty: "easy" },
    { category: "GAE", question: "Qual é o maior oceano do mundo?", options: JSON.stringify(["Atlântico", "Índico", "Pacífico"]), correctIndex: 2, difficulty: "easy" },
    { category: "GAE", question: "Em que ano terminou a Segunda Guerra Mundial?", options: JSON.stringify(["1943", "1945", "1950"]), correctIndex: 1, difficulty: "medium" },
    { category: "GAE", question: "Qual é a língua mais falada no mundo?", options: JSON.stringify(["Inglês", "Mandarim", "Espanhol"]), correctIndex: 1, difficulty: "medium" },
    { category: "GAE", question: "Qual país tem a maior população?", options: JSON.stringify(["Índia", "EUA", "China"]), correctIndex: 0, difficulty: "medium" },
    { category: "GAE", question: "Quem pintou a Mona Lisa?", options: JSON.stringify(["Michelangelo", "Leonardo da Vinci", "Rafael"]), correctIndex: 1, difficulty: "easy" },
    { category: "GAE", question: "Qual é o maior deserto do mundo?", options: JSON.stringify(["Saara", "Antártida", "Gobi"]), correctIndex: 1, difficulty: "hard" },
    { category: "GAE", question: "Em que ano foi fundada a ONU?", options: JSON.stringify(["1942", "1945", "1950"]), correctIndex: 1, difficulty: "hard" },
    { category: "GAE", question: "Qual é o rio mais longo do mundo?", options: JSON.stringify(["Amazonas", "Nilo", "Yangtze"]), correctIndex: 1, difficulty: "medium" },

    // FIS - Physics
    { category: "FIS", question: "Qual é a velocidade da luz?", options: JSON.stringify(["300.000 km/s", "150.000 km/s", "500.000 km/s"]), correctIndex: 0, difficulty: "easy" },
    { category: "FIS", question: "O que é a Lei de Newton F=ma?", options: JSON.stringify(["Força = massa × aceleração", "Força = velocidade × tempo", "Energia = massa × velocidade"]), correctIndex: 0, difficulty: "easy" },
    { category: "FIS", question: "Qual partícula tem carga negativa?", options: JSON.stringify(["Próton", "Neutrão", "Eletrão"]), correctIndex: 2, difficulty: "easy" },
    { category: "FIS", question: "O que mede o Voltímetro?", options: JSON.stringify(["Corrente", "Tensão", "Resistência"]), correctIndex: 1, difficulty: "medium" },
    { category: "FIS", question: "Qual é a unidade de frequência?", options: JSON.stringify(["Watt", "Hertz", "Joule"]), correctIndex: 1, difficulty: "medium" },
    { category: "FIS", question: "O que é o efeito Doppler?", options: JSON.stringify(["Mudança de frequência por movimento", "Reflexão da luz", "Absorção de calor"]), correctIndex: 0, difficulty: "hard" },
    { category: "FIS", question: "Qual é a constante gravitacional aproximada na Terra?", options: JSON.stringify(["9.8 m/s²", "6.7 m/s²", "12.5 m/s²"]), correctIndex: 0, difficulty: "medium" },
    { category: "FIS", question: "O que é energia cinética?", options: JSON.stringify(["Energia do movimento", "Energia armazenada", "Energia térmica"]), correctIndex: 0, difficulty: "easy" },
    { category: "FIS", question: "Quem formulou a teoria da relatividade?", options: JSON.stringify(["Newton", "Einstein", "Bohr"]), correctIndex: 1, difficulty: "easy" },
    { category: "FIS", question: "O que é um fotão?", options: JSON.stringify(["Partícula de luz", "Partícula de matéria", "Onda sonora"]), correctIndex: 0, difficulty: "hard" },
];

async function main() {
    console.log("Seeding questions...");

    // Clear existing questions
    await prisma.question.deleteMany();

    // Insert all questions
    for (const q of questions) {
        await prisma.question.create({ data: q });
    }

    console.log(`Seeded ${questions.length} questions`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
