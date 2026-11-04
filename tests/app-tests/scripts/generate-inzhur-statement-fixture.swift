// Writes the synthetic Inzhur securities account statement used by the e2e suite: swift generate-inzhur-statement-fixture.swift <out.pdf>; items are drawn column by column so PDFKit keeps each table cell as its own text item
import CoreGraphics
import CoreText
import Foundation

struct Fund {
    let nameLines: [String]
    let codeLines: [String]
    let isin: String
    let nominal: Int
    let quantity: Int
}

let statementDate = "31.10.2026"
let typeLines = ["Інвестиційний", "сертифікат", "електронний", "іменний"]
let funds = [
    Fund(
        nameLines: ["ТОВАРИСТВО З ОБМЕЖЕНОЮ", "ВІДПОВІДАЛЬНІСТЮ", "\"ІНЖУР\"/ЗАКРИТИЙ", "НЕДИВЕРСИФІКОВАНИЙ", "ПАЙОВИЙ ІНВЕСТИЦІЙНИЙ", "ФОНД \"ІНЖУР REIT\"; Дійсний"],
        codeLines: ["44154853 -", "23201750"],
        isin: "UA5000014044",
        nominal: 10,
        quantity: 1950
    ),
    Fund(
        nameLines: ["ТОВАРИСТВО З ОБМЕЖЕНОЮ", "ВІДПОВІДАЛЬНІСТЮ \"ІНЖУР\"", "(ПАЙОВИЙ ІНВЕСТИЦІЙНИЙ", "ФОНД \"ІНЖУР ЕНЕРДЖІ\");", "Дійсний"],
        codeLines: ["44154853 -", "23201633"],
        isin: "UA5000012246",
        nominal: 4000,
        quantity: 2
    )
]

func spaced(_ value: Int) -> String {
    let digits = String(value)
    var result = ""
    for (index, character) in digits.enumerated() {
        if index > 0 && (digits.count - index) % 3 == 0 {
            result.append(" ")
        }
        result.append(character)
    }
    return result
}

var items: [(x: CGFloat, y: CGFloat, text: String)] = [
    (150, 800, "Виписка про стан рахунку в цінних паперах"),
    (250, 780, "на \(statementDate)"),
    (250, 760, "Дата та час складання виписки: \(statementDate)"),
    (50, 740, "Депонент"),
    (50, 720, "Найменування / прізвище, ім'я, по батькові"),
    (300, 720, "Тестенко Тест Тестович"),
    (50, 700, "Код за ЄДРПОУ/Ідентифікаційний код"),
    (300, 700, "0000000000"),
    (50, 680, "Серія, номер, дата видачі паспорту"),
    (300, 680, "Серія та номер: 000000000 Дата видачі: 01.01.2020"),
    (50, 660, "Депозитарний код рахунку в цінних паперах"),
    (300, 660, "000000-IN00000000; Активний"),
    (50, 640, "Депозитарна установа"),
    (300, 640, "Найменування: ТОВ \"ІНЖУР КЕПІТАЛ\""),
    (50, 600, "Найменування емітента за ГС; Код ЄДРПОУ"),
    (250, 600, "ISIN"),
    (330, 600, "Вид, тип,"),
    (420, 600, "Номінальна"),
    (510, 600, "Кількість ЦП,"),
    (580, 600, "Загальна")
]

var top: CGFloat = 560
for fund in funds {
    for (index, line) in fund.nameLines.enumerated() {
        items.append((50, top - CGFloat(index) * 20, line))
    }
    for (index, line) in fund.codeLines.enumerated() {
        items.append((190, top - CGFloat(index) * 20, line))
    }
    for (index, line) in typeLines.enumerated() {
        items.append((330, top - CGFloat(index) * 20, line))
    }
    items.append((250, top, fund.isin))
    items.append((420, top, "\(fund.nominal),00 (UAH)"))
    items.append((510, top, spaced(fund.quantity)))
    items.append((580, top, spaced(fund.quantity * fund.nominal)))
    for x: CGFloat in [650, 680, 710] {
        items.append((x, top, "0"))
    }
    top -= CGFloat(max(fund.nameLines.count, typeLines.count) + 1) * 20
}

var mediaBox = CGRect(x: 0, y: 0, width: 760, height: 842)
guard CommandLine.arguments.count > 1, let context = CGContext(URL(fileURLWithPath: CommandLine.arguments[1]) as CFURL, mediaBox: &mediaBox, nil) else {
    FileHandle.standardError.write(Data("usage: generate-inzhur-statement-fixture.swift <out.pdf>\n".utf8))
    exit(1)
}

let font = CTFontCreateWithName("Helvetica" as CFString, 8, nil)
let attributes: [NSAttributedString.Key: Any] = [NSAttributedString.Key(kCTFontAttributeName as String): font]
let drawingOrder = items.sorted { $0.x != $1.x ? $0.x > $1.x : $0.y > $1.y }

context.beginPDFPage(nil)
for item in drawingOrder {
    context.textPosition = CGPoint(x: item.x, y: item.y)
    CTLineDraw(CTLineCreateWithAttributedString(NSAttributedString(string: item.text, attributes: attributes)), context)
}
context.endPDFPage()
context.closePDF()
