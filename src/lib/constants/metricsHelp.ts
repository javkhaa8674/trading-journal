// lib/constants/metricsHelp.ts

import { totalmem } from "os";

export const metricsHelp = {
    // Dashboard Stats
    totalTrades: {
        title: "Нийт арилжаа (Total Trades)",
        description: "Таны нийт хийсэн арилжааны тоо. Илүү их арилжаа хийх нь туршлага хуримтлуулах боломжийг нэмэгдүүлдэг."
    },
    winRate: {
        title: "Ялалтын хувь (Win Rate)",
        description: "Нийт арилжаанаас ашигтайгаар хаагдсан арилжааны эзлэх хувь. Өндөр байх тусмаа сайн. Жишээ: 50% -с дээш байвал ашигтай."
    },
    lossRate: {
        title: "Алдагдлын хувь (Loss Rate)",
        description: "Нийт арилжаанаас алдагдалтайгаар хаагдсан арилжааны эзлэх хувь."
    },
    netProfit: {
        title: "Цэвэр ашиг (Net Profit)",
        description: "Бүх арилжааны ашгийн нийлбэр. Эерэг утга нь ашигтай, сөрөг утга нь алдагдалтай гэсэн үг."
    },
    avgDrawdown: {
        title: "Дундаж уналт (Average Drawdown)",
        description: "Арилжааны дундаж уналтын хувь. Бага байх тусмаа сайн."
    },
    maxDrawdown: {
        title: "Хамгийн их уналт (Max Drawdown)",
        description: "Хамгийн өндөр цэгээс хамгийн доод цэг хүртэлх уналтын хувь. Бага байх тусмаа сайн."
    },
    profitFactor: {
        title: "Ашгийн хүчин зүйл (Profit Factor)",
        description: "Нийт ашгийг нийт алдагдалд харьцуулсан харьцаа. 1.5-с дээш байх нь сайн үзүүлэлт."
    },
    expectancy: {
        title: "Хүлээгдэж буй ашиг (Expectancy)",
        description: "Дунджаар нэг арилжаанд ногдох ашиг. Эерэг байх нь урт хугацаанд ашигтай байх боломжтой."
    },
    avgWin: {
        title: "Дундаж ашиг (Average Win)",
        description: "Ашигтай арилжаануудын дундаж ашиг."
    },
    avgLoss: {
        title: "Дундаж алдагдал (Average Loss)",
        description: "Алдагдалтай арилжаануудын дундаж алдагдал."
    },
    avgPositionSize: {
        title: "Дундаж байрлалын хэмжээ (Average Position Size)",
        description: "Нэг удаагийн арилжаанд дунджаар хэдэн лотын арилжаа хийж байгааг илэрхийлдэг."
    },
    avgHoldingTime: {
        title: "Дундаж барьсан хугацаа (Average Holding Time)",
        description: "Арилжааг хаах хүртэлх дундаж хугацаа. Энэ нь таны арилжааны хэв маягийг ойлгоход тусална (түргэн арилжаа эсвэл удаан хугацааны арилжаа)."
    },
    rrrOverall: {
        title: "RRR Overall (Overall Risk/Reward Ratio)",
        description: "Нийт эрсдэл/Ашгийн харьцаа. 1.5-с дээш байх нь сайн."
    },
    rrrWin: {
        title: "RRR Win (Risk/Reward Ratio for Winning Trades)",
        description: "Хожсон арилжаануудын дундаж RRR. Өндөр байх тусмаа сайн. 2.0-с дээш байлгахыг зөвлөж байна."
    },

    rrrLoss: {
        title: "RRR Loss (Risk/Reward Ratio for Losing Trades)",
        description: "Алдагдсан арилжаануудын дундаж RRR. Энэ утга нь өндөр RRR-тэй (том ашиг хийхээр төлөвлөсөн) арилжаанууд чинь алдагдалтай хаагдаж байгаа эсэхийг харуулна. RRR Loss өндөр байвал өндөр RRR-тэй арилжаанууд чинь алдагдалтай хаагдаж байна гэсэн үг."
    },
    sharpeRatio: {
        title: "Шарп харьцаа (Sharpe Ratio)",
        description: "Эрсдэлд тохируулсан ашиг. 1-с дээш байх нь сайн, 2-с дээш бол маш сайн."
    },
    calmarRatio: {
        title: "Калмар харьцаа (Calmar Ratio)",
        description: "Жилийн ашгийг хамгийн их уналтад харьцуулсан харьцаа. 1-с дээш байх нь сайн."
    },
    consistency: {
        title: "Тогтвортой байдал (Consistency)",
        description: "Арилжааны үр дүнгийн тогтвортой байдал. 70% -с дээш байх нь тогтвортой."
    },
    rrr: {
        title: "Эрсдэл/Ашгийн харьцаа (Risk/Reward Ratio)",
        description: "Дундаж ашгийг дундаж алдагдалд харьцуулсан харьцаа. 1.5-с дээш байх нь сайн."
    },
    // Charts
    equityCurve: {
        title: "Хөрөнгийн муруй (Equity Curve)",
        description: "Цаг хугацааны явцад таны нийт хөрөнгийн өөрчлөлтийг харуулсан график."
    },
    equityDrawdown: {
        title: "Хөрөнгийн ба уналтын график (Equity Drawdown Chart)",
        description: "Хөрөнгийн хамгийн өндөр цэгээс хойшхи бууралтыг хувиар харуулсан график."
    },
    numberOfTradingDays: {
        title: "Арилжааны өдрүүдийн тоо (Number of Trading Days)",
        description: "Таны хийсэн арилжааны өдрүүдийн тоо. Илүү олон өдрүүдэд арилжаа хийх нь туршлага хуримтлуулах боломжийг нэмэгдүүлдэг."
    },
    totalUsedLots: {
        title: "Нийт ашигласан лотууд (Total Used Lots)",
        description: "Таны нийт ашигласан лотуудын тоо. Энэ нь таны арилжааны хэмжээний хэв маягийг ойлгоход тусална."
    },
    biggestWin: {
        title: "Хамгийн том ашиг (Biggest Win)",
        description: "Таны хамгийн өндөр ашигтай арилжаа. Энэ нь таны хамгийн амжилттай арилжааг харуулна."
    },
    biggestLoss: {
        title: "Хамгийн том алдагдал (Biggest Loss)",
        description: "Таны хамгийн өндөр алдагдалтай арилжаа. Энэ нь таны хамгийн муу арилжааг харуулна."
    },
    tradingDayPerformance: {
        title: "Арилжааны өдрийн гүйцэтгэл (Trading Day Performance)",
        description: "Арилжааны өдрүүдийн гүйцэтгэлийг харуулсан график. Ногоон - ашигтай өдөр, Улаан - алдагдалтай өдөр."
    },
    mostTradedPairs: {
        title: "Хамгийн их арилжаалагдсан хослолууд (Most Traded Pairs)",
        description: "Таны хамгийн их арилжаалагдсан валютын хослолууд. Энэ нь таны гол анхаарлаа хандуулдаг зах зээлүүдийг харуулна."
    },
    longShort: {
        title: "Худалдан авалт/Борлуулалт (Long/Short Analysis)",
        description: "Худалдан авалт (Long) болон борлуулалт (Short) арилжаануудын харьцуулалт. Энэ нь таны арилжааны хэв маягийг ойлгоход тусална."
    },
    dailySummary: {
        title: "Өдрийн тойм (Daily Summary)",
        description: "Өдрийн арилжааны тойм. Өдрийн ашгийн нийлбэр, хамгийн том ашиг, хамгийн том алдагдал зэрэг мэдээллийг нэгтгэн харуулсан график."
    },
    pnlDisridbutionbyDuration: {
        title: "Хугацааны PnL тархалт (PnL Distribution by Duration)",
        description: "Арилжааны үргэлжлэх хугацаа болон ашгийн хоорондын хамаарал. Энэ нь таны арилжааны хэв маягийг ойлгоход тусална."
    },
    instrumentProfitAnalysis: {
        title: "Хослолын ашгийн дүн шинжилгээ (Instrument Profit Analysis)",
        description: "Хослол (symbol) бүрийн нийт ашгийг харуулсан график. Энэ нь таны хамгийн ашигтай болон хамгийн алдагдалтай хослолыг тодорхойлоход тусална."
    },
    instrumentVolumeAnalysis: {
        title: "Хослолын хэмжээний дүн шинжилгээ (Instrument Volume Analysis)",
        description: "Хослол (symbol) бүрийн арилжааны хэмжээг (lot) харуулсан график. Энэ нь таны хамгийн их анхаарлаа хандуулдаг зах зээлүүдийг харуулна."
    },
    monthlyHeatmap: {
        title: "Сарын ашгийн дулааны зураг (Monthly Heatmap)",
        description: "Сар бүрийн ашгийг өнгөөр ялгаж харуулсан харагдац. Ногоон - ашигтай, Улаан - алдагдалтай."
    },
    dailyReturn: {
        title: "Өдрийн өгөөж (Daily Return)",
        description: "Өдөр бүрийн ашгийн хувийн өөрчлөлт."
    },
    // Long/Short
    longShortAnalysis: {
        title: "Худалдан авалт/Борлуулалт (Long/Short Analysis)",
        description: "Худалдан авалт (Long) болон борлуулалт (Short) арилжаануудын харьцуулалт."
    },
    // Duration
    duration: {
        title: "Хугацааны дүн шинжилгээ (Duration Analysis)",
        description: "Арилжааны үргэлжлэх хугацаа болон ашгийн хоорондын хамаарал."
    },
    // Instruments
    instrumentProfit: {
        title: "Багажны ашгийн дүн шинжилгээ",
        description: "Арилжааны багаж (symbol) бүрийн нийт ашгийг харуулсан график."
    },
    instrumentVolume: {
        title: "Багажны хэмжээний дүн шинжилгээ",
        description: "Арилжааны багаж (symbol) бүрийн арилжааны хэмжээг (lot) харуулсан график."
    },
    dailyLossLimit: {
        title: "Өдрийн алдагдалын хязгаар (Daily Loss Limit)",
        description: "Өдрийн equity алдагдлын хязгаар (5%). Өөрөөр хэлбэл таны өдрийн нээлттэй болон хаалттай бүх арилжааны алдагдал хязгаарыг харуулна. Хэрэв хязгаар хэтэрвэл Challnge Failed! мессеж гарч, улаан өнгөөр илэрхийлнэ."
    },
    totalLossLimit: {
        title: "Нийт алдагдлын хязгаар (Total Loss Limit)",
        description: "Нийт алдагдлын хязгаар (10%). Өөрөөр хэлбэл таны нийт хаалттай арилжааны алдагдал хязгаарыг харуулна. Хэрэв хязгаар хэтэрвэл Challnge Failed! мессеж гарч, улаан өнгөөр илэрхийлнэ."
    },
    // Risk
    dailyLoss: {
        title: "Өдрийн алдагдал (Daily Loss)",
        description: "Өдрийн алдагдлын хязгаар (5%). Хэрэв хязгаар хэтэрвэл улаан өнгөөр илэрхийлнэ."
    },
    totalDrawdown: {
        title: "Нийт уналт (Total Drawdown)",
        description: "Нийт уналтын хязгаар (10%). Хэрэв хязгаар хэтэрвэл улаан өнгөөр илэрхийлнэ."
    },
    // Spider Chart
    spiderChart: {
        title: "Гүйцэтгэлийн радар (Performance Radar)",
        description: "Таны арилжааны бүх үзүүлэлтүүдийг нэг графикт нэгтгэн харуулсан харагдац."
    },
};

export type MetricKey = keyof typeof metricsHelp;