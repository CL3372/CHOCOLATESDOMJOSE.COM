import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { Lang } from "../context/CartContext";
import { LANGS, detectLang, setLangInUrl } from "../lib/lang";

const COMPANY = {
  name: "Nelson & Carla Louro Lda",
  brand: "Chocolates Dom José",
  nif: "513070389",
  address: "Rua Dr. Alberto Martins dos Santos, n.º 4, 2540-087 Bombarral, Portugal",
  email: "geral@chocolatesdomjose.com",
  phone: "+351 912 630 054",
  website: "https://chocolatesdomjose.com",
};

const LAST_UPDATED = "19 maio 2026";

type Section = { h: string; p: string[] };

const TERMS: Record<Lang, { title: string; intro: string; sections: Section[] }> = {
  PT: {
    title: "Termos e Condições",
    intro: `Bem-vindo(a) ao website ${COMPANY.website} (a seguir designado "Site"), explorado por ${COMPANY.name}, NIPC ${COMPANY.nif}, com sede em ${COMPANY.address}, sob a marca ${COMPANY.brand} (doravante "nós" ou "a Empresa"). A utilização do Site e a aquisição de produtos implicam a aceitação integral dos presentes Termos e Condições.`,
    sections: [
      {
        h: "1. Identificação",
        p: [
          `Denominação social: ${COMPANY.name}`,
          `NIPC: ${COMPANY.nif}`,
          `Sede: ${COMPANY.address}`,
          `Email: ${COMPANY.email} | Telefone: ${COMPANY.phone}`,
        ],
      },
      {
        h: "2. Produtos e preços",
        p: [
          "Os produtos comercializados são chocolates artesanais e produtos gourmet. Todos os preços indicados no Site são em Euros (€) e incluem IVA à taxa legal em vigor (23%).",
          "A Empresa reserva-se o direito de alterar preços e disponibilidade a qualquer momento, sem aviso prévio. O preço aplicável a cada encomenda é o vigente no momento da finalização da mesma.",
        ],
      },
      {
        h: "3. Encomendas e pagamento",
        p: [
          "As encomendas são efetuadas online através do Site. O pagamento é processado pelo prestador de serviços EasyPay (Pagamentos Online Unipessoal, Lda) e podem ser disponibilizados os métodos: MB WAY, Multibanco e Cartão de Crédito/Débito (Visa/Mastercard), consoante a configuração ativa.",
          "A encomenda só é considerada confirmada após boa cobrança do pagamento. O cliente recebe confirmação por email.",
        ],
      },
      {
        h: "4. Faturação",
        p: [
          "Para cada encomenda paga é emitida uma Fatura-Recibo eletrónica através do sistema certificado de faturação Moloni e enviada por email para o cliente.",
          "Caso pretenda fatura com NIF, deve indicá-lo no momento da finalização da encomenda. Não é possível alterar o NIF após emissão da fatura.",
        ],
      },
      {
        h: "5. Entrega e expedição",
        p: [
          "Os produtos são expedidos para Portugal Continental e internacionalmente, através das transportadoras GLS e CTT. O prazo de entrega habitual é de 3 a 7 dias úteis após confirmação do pagamento.",
          "Os portes de envio são calculados com base no peso da encomenda e apresentados antes da finalização da compra. Para Portugal Continental são gratuitos em encomendas de valor igual ou superior a €100; para encomendas internacionais os portes são sempre cobrados, sem limiar de gratuitidade. A Empresa não é responsável por atrasos imputáveis às transportadoras.",
        ],
      },
      {
        h: "6. Direito de livre resolução",
        p: [
          "Nos termos do Decreto-Lei n.º 24/2014, o consumidor dispõe de 14 dias para resolver o contrato sem necessidade de justificação. Contudo, este direito não é aplicável a bens que, pela sua natureza, sejam suscetíveis de deterioração ou expiração rápida, como é o caso de produtos alimentares perecíveis (chocolates artesanais), nos termos do art. 17.º, n.º 1, alínea d) do referido diploma.",
          "Caso o produto seja entregue danificado ou em desconformidade, o cliente deve contactar-nos no prazo máximo de 48 horas após a receção, através de ${COMPANY.email}, anexando fotografias do problema.",
        ],
      },
      {
        h: "7. Política de devoluções",
        p: [
          "Em casos de defeito de fabrico ou erro na expedição, comprometemo-nos a substituir o produto ou reembolsar o valor pago, sem custos adicionais para o cliente, no prazo de 14 dias.",
        ],
      },
      {
        h: "8. Propriedade intelectual",
        p: [
          `Todos os conteúdos do Site (textos, imagens, logótipos, marca ${COMPANY.brand}) são propriedade da Empresa ou licenciados à mesma, protegidos pela legislação de propriedade intelectual. É proibida a sua reprodução, distribuição ou utilização sem autorização escrita.`,
        ],
      },
      {
        h: "9. Resolução alternativa de litígios",
        p: [
          "Em caso de litígio, o consumidor pode recorrer a uma entidade de resolução alternativa de litígios de consumo. Lista atualizada disponível no Portal do Consumidor: www.consumidor.gov.pt. Pode ainda recorrer à plataforma europeia de Resolução de Litígios em Linha (RLL): https://ec.europa.eu/consumers/odr.",
        ],
      },
      {
        h: "10. Lei aplicável e foro",
        p: [
          "Os presentes Termos e Condições regem-se pela lei portuguesa. Para resolução de qualquer litígio é competente o foro da comarca da sede da Empresa, com expressa renúncia a qualquer outro.",
        ],
      },
      {
        h: "11. Contacto",
        p: [
          `Para questões relacionadas com os presentes Termos ou com encomendas, contacte-nos em ${COMPANY.email} ou ${COMPANY.phone}.`,
        ],
      },
    ],
  },
  EN: {
    title: "Terms and Conditions",
    intro: `Welcome to ${COMPANY.website} (the "Site"), operated by ${COMPANY.name}, Portuguese VAT number ${COMPANY.nif}, registered office at ${COMPANY.address}, trading under the ${COMPANY.brand} brand (hereinafter "we" or "the Company"). Use of the Site and purchase of products implies full acceptance of these Terms and Conditions.`,
    sections: [
      { h: "1. Company details", p: [`Legal name: ${COMPANY.name}`, `VAT number: ${COMPANY.nif}`, `Registered office: ${COMPANY.address}`, `Email: ${COMPANY.email} | Phone: ${COMPANY.phone}`] },
      { h: "2. Products and prices", p: ["The products sold are artisan chocolates and gourmet products. All prices on the Site are in Euros (€) and include VAT at the legal rate in force (23%).", "The Company reserves the right to change prices and availability at any time. The price applicable to each order is the one in force when the order is placed."] },
      { h: "3. Orders and payment", p: ["Orders are placed online through the Site. Payment is processed by EasyPay (Pagamentos Online Unipessoal, Lda). Available methods may include: MB WAY, Multibanco and Credit/Debit Card (Visa/Mastercard).", "Orders are only confirmed after successful payment. The customer receives confirmation by email."] },
      { h: "4. Invoicing", p: ["For every paid order an electronic invoice-receipt is issued via the certified invoicing system Moloni and sent by email to the customer.", "If you wish to receive an invoice with your VAT number, please provide it during checkout. The VAT number cannot be changed after the invoice has been issued."] },
      { h: "5. Delivery and shipping", p: ["Products are shipped to Mainland Portugal and internationally, via the carriers GLS and CTT. Typical delivery time is 3 to 7 business days after payment confirmation.", "Shipping costs are calculated based on the order's weight and shown before order completion. For Mainland Portugal, shipping is free on orders of €100 or more; for international orders, shipping is always charged, with no free threshold. The Company is not liable for delays attributable to the carriers."] },
      { h: "6. Right of withdrawal", p: ["Under Portuguese Decree-Law no. 24/2014, consumers have 14 days to withdraw without justification. However, this right does not apply to goods which, by their nature, are perishable, such as fresh artisan chocolates (art. 17(1)(d) of said law).", `If the product is delivered damaged or non-compliant, the customer must contact us within 48 hours of receipt at ${COMPANY.email}, including photos.`] },
      { h: "7. Returns policy", p: ["In cases of manufacturing defects or shipping errors, we commit to replacing the product or refunding the amount paid, at no additional cost to the customer, within 14 days."] },
      { h: "8. Intellectual property", p: [`All Site content (texts, images, logos, the ${COMPANY.brand} brand) is owned by or licensed to the Company and protected by intellectual property law. Reproduction or use without written permission is prohibited.`] },
      { h: "9. Alternative dispute resolution", p: ["In case of dispute, the consumer may resort to a consumer ADR entity. Updated list at the Portuguese Consumer Portal: www.consumidor.gov.pt. The EU Online Dispute Resolution platform is also available: https://ec.europa.eu/consumers/odr."] },
      { h: "10. Governing law and jurisdiction", p: ["These Terms are governed by Portuguese law. The court of the Company's registered office shall have exclusive jurisdiction."] },
      { h: "11. Contact", p: [`For questions about these Terms or orders, contact us at ${COMPANY.email} or ${COMPANY.phone}.`] },
    ],
  },
  DE: {
    title: "Allgemeine Geschäftsbedingungen",
    intro: `Willkommen auf der Website ${COMPANY.website} (die "Website"), betrieben von ${COMPANY.name}, portugiesische Steuernummer ${COMPANY.nif}, mit Sitz in ${COMPANY.address}, unter der Marke ${COMPANY.brand} (nachfolgend "wir" oder "das Unternehmen"). Die Nutzung der Website und der Kauf von Produkten setzen die vollständige Annahme dieser Bedingungen voraus.`,
    sections: [
      { h: "1. Unternehmensangaben", p: [`Firmenname: ${COMPANY.name}`, `Steuernummer: ${COMPANY.nif}`, `Sitz: ${COMPANY.address}`, `E-Mail: ${COMPANY.email} | Telefon: ${COMPANY.phone}`] },
      { h: "2. Produkte und Preise", p: ["Verkauft werden handgemachte Schokoladen und Gourmetprodukte. Alle Preise sind in Euro (€) angegeben und enthalten die gesetzliche Mehrwertsteuer (23%).", "Wir behalten uns vor, Preise und Verfügbarkeit jederzeit zu ändern. Maßgeblich ist der Preis zum Zeitpunkt der Bestellung."] },
      { h: "3. Bestellung und Zahlung", p: ["Bestellungen erfolgen online. Die Zahlung wird durch EasyPay (Pagamentos Online Unipessoal, Lda) abgewickelt. Verfügbare Methoden können sein: MB WAY, Multibanco und Kredit-/Debitkarte (Visa/Mastercard).", "Bestellungen gelten erst nach erfolgreicher Zahlung als bestätigt. Die Kundin/der Kunde erhält eine Bestätigung per E-Mail."] },
      { h: "4. Rechnungsstellung", p: ["Für jede bezahlte Bestellung wird eine elektronische Rechnung über das zertifizierte System Moloni erstellt und per E-Mail an die Kundin/den Kunden gesendet.", "Falls eine Rechnung mit Steuernummer gewünscht ist, ist diese beim Checkout anzugeben. Eine nachträgliche Änderung ist nicht möglich."] },
      { h: "5. Lieferung und Versand", p: ["Versand nach Festland-Portugal und international, über die Versanddienstleister GLS und CTT. Übliche Lieferzeit: 3 bis 7 Werktage nach Zahlungseingang.", "Die Versandkosten werden auf Basis des Gewichts der Bestellung berechnet und vor Bestellabschluss angezeigt. Nach Festland-Portugal ist der Versand ab einem Bestellwert von €100 kostenlos; bei internationalen Bestellungen wird der Versand immer berechnet, ohne kostenlose Schwelle. Wir haften nicht für Verzögerungen durch die Transportunternehmen."] },
      { h: "6. Widerrufsrecht", p: ["Gemäß dem portugiesischen Gesetzesdekret Nr. 24/2014 haben Verbraucher 14 Tage Widerrufsrecht. Dieses gilt jedoch nicht für leicht verderbliche Waren wie frische handgemachte Schokolade (Art. 17 Abs. 1 lit. d).", `Bei beschädigter oder fehlerhafter Lieferung kontaktieren Sie uns bitte innerhalb von 48 Stunden nach Erhalt unter ${COMPANY.email}, mit Fotos.`] },
      { h: "7. Rückgaberichtlinie", p: ["Bei Herstellungsfehlern oder Versandfehlern ersetzen wir das Produkt oder erstatten den gezahlten Betrag innerhalb von 14 Tagen, ohne zusätzliche Kosten."] },
      { h: "8. Geistiges Eigentum", p: [`Alle Inhalte (Texte, Bilder, Logos, Marke ${COMPANY.brand}) sind Eigentum oder Lizenz des Unternehmens. Vervielfältigung oder Nutzung ohne schriftliche Zustimmung ist untersagt.`] },
      { h: "9. Alternative Streitbeilegung", p: ["Bei Streitigkeiten kann eine Verbraucherschlichtungsstelle angerufen werden. Aktuelle Liste: www.consumidor.gov.pt. EU-Plattform für Online-Streitbeilegung: https://ec.europa.eu/consumers/odr."] },
      { h: "10. Anwendbares Recht und Gerichtsstand", p: ["Es gilt portugiesisches Recht. Gerichtsstand ist der Sitz des Unternehmens."] },
      { h: "11. Kontakt", p: [`Bei Fragen zu diesen Bedingungen oder Bestellungen erreichen Sie uns unter ${COMPANY.email} oder ${COMPANY.phone}.`] },
    ],
  },
  NL: {
    title: "Algemene Voorwaarden",
    intro: `Welkom op ${COMPANY.website} (de "Site"), beheerd door ${COMPANY.name}, Portugees btw-nummer ${COMPANY.nif}, statutaire zetel te ${COMPANY.address}, onder het merk ${COMPANY.brand} (hierna "wij" of "het Bedrijf"). Het gebruik van de Site en het plaatsen van een bestelling impliceert volledige aanvaarding van deze Voorwaarden.`,
    sections: [
      { h: "1. Bedrijfsgegevens", p: [`Bedrijfsnaam: ${COMPANY.name}`, `BTW-nummer: ${COMPANY.nif}`, `Zetel: ${COMPANY.address}`, `E-mail: ${COMPANY.email} | Telefoon: ${COMPANY.phone}`] },
      { h: "2. Producten en prijzen", p: ["Wij verkopen ambachtelijke chocolade en gourmetproducten. Alle prijzen zijn in Euro (€) en inclusief btw tegen het wettelijke tarief (23%).", "Wij behouden ons het recht voor prijzen en beschikbaarheid op elk moment te wijzigen. De prijs bij bestelling is bindend."] },
      { h: "3. Bestellingen en betaling", p: ["Bestellingen worden online geplaatst. De betaling wordt verwerkt door EasyPay (Pagamentos Online Unipessoal, Lda). Beschikbare methoden kunnen zijn: MB WAY, Multibanco en Credit-/Debitcard (Visa/Mastercard).", "Bestellingen worden pas bevestigd na succesvolle betaling. De klant ontvangt een bevestiging per e-mail."] },
      { h: "4. Facturering", p: ["Voor elke betaalde bestelling wordt een elektronische factuur uitgegeven via het gecertificeerde systeem Moloni en per e-mail aan de klant verzonden.", "Indien u een factuur met btw-nummer wenst, geef dit op tijdens het afrekenen. Achteraf wijzigen is niet mogelijk."] },
      { h: "5. Levering en verzending", p: ["Verzending naar het Portugese vasteland en internationaal, via de vervoerders GLS en CTT. De gebruikelijke leveringstijd is 3 tot 7 werkdagen na betalingsbevestiging.", "Verzendkosten worden berekend op basis van het gewicht van de bestelling en getoond vóór afronding van de bestelling. Naar het Portugese vasteland is verzending gratis vanaf een bestelwaarde van €100; bij internationale bestellingen worden verzendkosten altijd in rekening gebracht, zonder gratis drempel. Wij zijn niet aansprakelijk voor vertragingen door de vervoerders."] },
      { h: "6. Herroepingsrecht", p: ["Volgens het Portugese Decreet-Wet nr. 24/2014 hebben consumenten 14 dagen herroepingsrecht. Dit recht geldt echter niet voor bederfelijke waren, zoals verse ambachtelijke chocolade (art. 17(1)(d)).", `Indien het product beschadigd of niet-conform geleverd wordt, neem binnen 48 uur contact op via ${COMPANY.email}, met foto's.`] },
      { h: "7. Retourbeleid", p: ["Bij fabricagefouten of verzendfouten vervangen wij het product of vergoeden het betaalde bedrag binnen 14 dagen, zonder bijkomende kosten."] },
      { h: "8. Intellectueel eigendom", p: [`Alle inhoud (teksten, afbeeldingen, logo's, merk ${COMPANY.brand}) is eigendom van of in licentie bij het Bedrijf. Reproductie zonder schriftelijke toestemming is verboden.`] },
      { h: "9. Alternatieve geschillenbeslechting", p: ["Bij geschillen kan een consumentenbemiddelingsinstantie worden ingeschakeld. Bijgewerkte lijst: www.consumidor.gov.pt. EU-platform voor onlinegeschillenbeslechting: https://ec.europa.eu/consumers/odr."] },
      { h: "10. Toepasselijk recht en bevoegde rechtbank", p: ["Op deze Voorwaarden is Portugees recht van toepassing. De rechtbank van de zetel van het Bedrijf is exclusief bevoegd."] },
      { h: "11. Contact", p: [`Voor vragen over deze Voorwaarden of bestellingen kunt u contact opnemen via ${COMPANY.email} of ${COMPANY.phone}.`] },
    ],
  },
};

const PRIVACY: Record<Lang, { title: string; intro: string; sections: Section[] }> = {
  PT: {
    title: "Política de Privacidade",
    intro: `A ${COMPANY.name} (NIPC ${COMPANY.nif}), com sede em ${COMPANY.address}, sob a marca ${COMPANY.brand}, é responsável pelo tratamento dos dados pessoais recolhidos através do website ${COMPANY.website}, em conformidade com o Regulamento (UE) 2016/679 (RGPD) e a Lei n.º 58/2019.`,
    sections: [
      { h: "1. Responsável pelo tratamento", p: [`${COMPANY.name} — NIPC ${COMPANY.nif}`, `Morada: ${COMPANY.address}`, `Email para questões de privacidade: ${COMPANY.email}`, `Telefone: ${COMPANY.phone}`] },
      { h: "2. Dados recolhidos", p: ["Recolhemos os seguintes dados pessoais: nome, email, telefone, NIF (se fornecido para fatura), morada de entrega, conteúdo de mensagens enviadas pelo formulário de contacto, e dados de pagamento (processados diretamente pelo prestador EasyPay — não armazenamos dados de cartão)."] },
      { h: "3. Finalidades e fundamento legal", p: ["Processamento de encomendas e gestão da relação contratual (execução de contrato, art. 6.º, n.º 1, al. b) RGPD).", "Emissão e envio de faturas (cumprimento de obrigação legal fiscal, art. 6.º, n.º 1, al. c) RGPD).", "Comunicação com o cliente sobre o estado da encomenda (execução de contrato).", "Resposta a pedidos enviados via formulário de contacto (interesse legítimo / consentimento)."] },
      { h: "4. Subcontratantes e partilha de dados", p: ["Para prestar os nossos serviços partilhamos dados estritamente necessários com: EasyPay (processamento de pagamentos), Moloni (emissão de faturas certificada), prestadores de email/SMTP (envio de confirmações), e operadores logísticos (entrega). Estes subcontratantes estão obrigados a tratar os dados em conformidade com o RGPD."] },
      { h: "5. Transferências internacionais", p: ["Não transferimos dados para fora do Espaço Económico Europeu (EEE), salvo quando os subcontratantes (ex. serviços de email) o façam ao abrigo de garantias adequadas (cláusulas contratuais-tipo da Comissão Europeia)."] },
      { h: "6. Prazos de conservação", p: ["Dados de encomendas e faturação: 10 anos (obrigação legal fiscal — art. 123.º CIRC).", "Dados de contacto (formulário): até 2 anos após o último contacto, salvo solicitação anterior de eliminação."] },
      { h: "7. Direitos do titular dos dados", p: ["Tem direito a aceder, retificar, apagar (direito ao esquecimento), limitar ou opor-se ao tratamento dos seus dados, bem como à portabilidade. Para exercer estes direitos contacte-nos em ${COMPANY.email}.", "Tem ainda direito a apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD): www.cnpd.pt."] },
      { h: "8. Cookies", p: ["O nosso Site não utiliza cookies de rastreamento de terceiros nem ferramentas de marketing. Apenas é utilizado armazenamento técnico local (localStorage) para guardar a sua preferência de idioma e o conteúdo do carrinho — estes não constituem cookies sujeitas a consentimento."] },
      { h: "9. Segurança", p: ["Aplicamos medidas técnicas e organizativas adequadas para proteger os seus dados, incluindo ligação HTTPS encriptada (TLS) e acesso restrito a pessoal autorizado."] },
      { h: "10. Alterações", p: ["A presente política pode ser atualizada. A versão em vigor estará sempre publicada no Site, com indicação da data da última atualização."] },
    ],
  },
  EN: {
    title: "Privacy Policy",
    intro: `${COMPANY.name} (VAT ${COMPANY.nif}), registered office at ${COMPANY.address}, trading as ${COMPANY.brand}, is the data controller for personal data collected through ${COMPANY.website}, in accordance with Regulation (EU) 2016/679 (GDPR) and Portuguese Law no. 58/2019.`,
    sections: [
      { h: "1. Data controller", p: [`${COMPANY.name} — VAT ${COMPANY.nif}`, `Address: ${COMPANY.address}`, `Privacy contact: ${COMPANY.email}`, `Phone: ${COMPANY.phone}`] },
      { h: "2. Data we collect", p: ["We collect the following personal data: name, email, phone, VAT number (if provided for invoicing), shipping address, contact form messages, and payment data (processed directly by EasyPay — we do not store card data)."] },
      { h: "3. Purposes and legal basis", p: ["Order processing and contract management (contract performance, GDPR art. 6(1)(b)).", "Issuing and sending invoices (legal obligation, GDPR art. 6(1)(c)).", "Communicating with the customer about order status (contract performance).", "Responding to contact form messages (legitimate interest / consent)."] },
      { h: "4. Processors and data sharing", p: ["To deliver our services we share strictly necessary data with: EasyPay (payment processing), Moloni (certified invoicing), email/SMTP providers (confirmations), and carriers (delivery). These processors are bound to GDPR-compliant processing."] },
      { h: "5. International transfers", p: ["We do not transfer data outside the EEA, except where processors do so under appropriate safeguards (EU Standard Contractual Clauses)."] },
      { h: "6. Retention periods", p: ["Order and invoicing data: 10 years (Portuguese tax law — art. 123 CIRC).", "Contact data (form): up to 2 years after last contact, unless deletion is requested earlier."] },
      { h: "7. Your rights", p: [`You have the right to access, rectify, erase, restrict or object to processing of your data, and to data portability. To exercise these rights contact ${COMPANY.email}.`, "You may also file a complaint with the Portuguese Data Protection Authority (CNPD): www.cnpd.pt."] },
      { h: "8. Cookies", p: ["Our Site does not use third-party tracking cookies or marketing tools. Only local technical storage (localStorage) is used to remember your language preference and cart contents — these are not cookies subject to consent."] },
      { h: "9. Security", p: ["We apply appropriate technical and organisational measures to protect your data, including HTTPS encryption (TLS) and restricted access by authorised staff only."] },
      { h: "10. Changes", p: ["This policy may be updated. The version in force is always published on the Site, with the date of last update."] },
    ],
  },
  DE: {
    title: "Datenschutzerklärung",
    intro: `${COMPANY.name} (Steuernummer ${COMPANY.nif}), Sitz: ${COMPANY.address}, unter der Marke ${COMPANY.brand}, ist Verantwortliche für die Verarbeitung personenbezogener Daten, die über ${COMPANY.website} erhoben werden, gemäß Verordnung (EU) 2016/679 (DSGVO) und dem portugiesischen Gesetz Nr. 58/2019.`,
    sections: [
      { h: "1. Verantwortliche", p: [`${COMPANY.name} — Steuernummer ${COMPANY.nif}`, `Adresse: ${COMPANY.address}`, `Datenschutzkontakt: ${COMPANY.email}`, `Telefon: ${COMPANY.phone}`] },
      { h: "2. Erhobene Daten", p: ["Wir erheben: Name, E-Mail, Telefon, Steuernummer (falls für Rechnung angegeben), Lieferadresse, Nachrichten über das Kontaktformular und Zahlungsdaten (direkt durch EasyPay verarbeitet – wir speichern keine Kartendaten)."] },
      { h: "3. Zwecke und Rechtsgrundlage", p: ["Bestellabwicklung und Vertragsmanagement (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO).", "Rechnungsstellung (rechtliche Verpflichtung, Art. 6 Abs. 1 lit. c).", "Kommunikation zum Bestellstatus (Vertragserfüllung).", "Beantwortung von Kontaktformularen (berechtigtes Interesse / Einwilligung)."] },
      { h: "4. Auftragsverarbeiter und Datenweitergabe", p: ["Zur Leistungserbringung teilen wir notwendige Daten mit: EasyPay (Zahlungen), Moloni (zertifizierte Rechnungsstellung), E-Mail-/SMTP-Anbietern (Bestätigungen) und Versanddienstleistern. Diese sind zur DSGVO-konformen Verarbeitung verpflichtet."] },
      { h: "5. Internationale Übermittlungen", p: ["Es findet keine Übermittlung außerhalb des EWR statt, außer wo Auftragsverarbeiter geeignete Garantien (EU-Standardvertragsklauseln) anwenden."] },
      { h: "6. Speicherfristen", p: ["Bestell- und Rechnungsdaten: 10 Jahre (portugiesisches Steuerrecht).", "Kontaktdaten (Formular): bis zu 2 Jahre nach letztem Kontakt, sofern nicht früher gelöscht."] },
      { h: "7. Ihre Rechte", p: [`Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit. Kontakt: ${COMPANY.email}.`, "Sie können eine Beschwerde bei der portugiesischen Datenschutzbehörde (CNPD) einreichen: www.cnpd.pt."] },
      { h: "8. Cookies", p: ["Unsere Website verwendet keine Tracking-Cookies oder Marketing-Tools. Nur lokaler technischer Speicher (localStorage) für Sprache und Warenkorb – nicht einwilligungspflichtig."] },
      { h: "9. Sicherheit", p: ["Wir setzen geeignete technische und organisatorische Maßnahmen ein, einschließlich HTTPS (TLS)."] },
      { h: "10. Änderungen", p: ["Diese Richtlinie kann aktualisiert werden. Die jeweils gültige Fassung ist auf der Website veröffentlicht."] },
    ],
  },
  NL: {
    title: "Privacybeleid",
    intro: `${COMPANY.name} (btw ${COMPANY.nif}), met zetel te ${COMPANY.address}, onder het merk ${COMPANY.brand}, is verwerkingsverantwoordelijke voor de persoonsgegevens die via ${COMPANY.website} worden verzameld, conform Verordening (EU) 2016/679 (AVG) en de Portugese Wet nr. 58/2019.`,
    sections: [
      { h: "1. Verwerkingsverantwoordelijke", p: [`${COMPANY.name} — btw ${COMPANY.nif}`, `Adres: ${COMPANY.address}`, `Privacycontact: ${COMPANY.email}`, `Telefoon: ${COMPANY.phone}`] },
      { h: "2. Verzamelde gegevens", p: ["Wij verzamelen: naam, e-mail, telefoon, btw-nummer (indien opgegeven voor factuur), leveradres, berichten via contactformulier en betaalgegevens (rechtstreeks verwerkt door EasyPay — wij bewaren geen kaartgegevens)."] },
      { h: "3. Doeleinden en rechtsgrond", p: ["Orderverwerking en contractbeheer (uitvoering overeenkomst, art. 6(1)(b) AVG).", "Facturatie (wettelijke verplichting, art. 6(1)(c)).", "Communicatie over orderstatus (uitvoering overeenkomst).", "Beantwoorden van contactformulieren (gerechtvaardigd belang / toestemming)."] },
      { h: "4. Verwerkers en gegevensdeling", p: ["Voor onze diensten delen wij strikt noodzakelijke gegevens met: EasyPay (betalingen), Moloni (gecertificeerde facturatie), e-mail/SMTP-aanbieders (bevestigingen) en vervoerders. Deze verwerkers zijn AVG-conform gebonden."] },
      { h: "5. Internationale doorgiften", p: ["Wij geven geen gegevens door buiten de EER, behalve wanneer verwerkers dit doen onder passende waarborgen (EU-modelclausules)."] },
      { h: "6. Bewaartermijnen", p: ["Order- en facturatiegegevens: 10 jaar (Portugees belastingrecht).", "Contactgegevens (formulier): tot 2 jaar na laatste contact, tenzij eerder verzocht om verwijdering."] },
      { h: "7. Uw rechten", p: [`U heeft recht op inzage, rectificatie, wissing, beperking, bezwaar en overdraagbaarheid. Contact: ${COMPANY.email}.`, "U kunt een klacht indienen bij de Portugese gegevensbeschermingsautoriteit (CNPD): www.cnpd.pt."] },
      { h: "8. Cookies", p: ["Onze Site gebruikt geen tracking-cookies of marketingtools van derden. Alleen lokale technische opslag (localStorage) voor taalvoorkeur en winkelwagen — niet toestemmingsplichtig."] },
      { h: "9. Beveiliging", p: ["Wij passen passende technische en organisatorische maatregelen toe, waaronder HTTPS (TLS)."] },
      { h: "10. Wijzigingen", p: ["Dit beleid kan worden bijgewerkt. De geldende versie staat altijd op de Site, met datum van laatste update."] },
    ],
  },
};

const UI: Record<Lang, { back: string; lastUpdated: string }> = {
  PT: { back: "Voltar à página inicial", lastUpdated: "Última atualização" },
  EN: { back: "Back to home", lastUpdated: "Last updated" },
  DE: { back: "Zurück zur Startseite", lastUpdated: "Zuletzt aktualisiert" },
  NL: { back: "Terug naar home", lastUpdated: "Laatst bijgewerkt" },
};

function LegalLayout({
  doc,
  lang,
  setLang,
}: {
  doc: { title: string; intro: string; sections: Section[] };
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  useEffect(() => {
    document.title = `${doc.title} | ${COMPANY.brand}`;
  }, [doc.title]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f08] via-[#0e0805] to-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm text-amber-300/80 hover:text-amber-200 transition"
          >
            ← {UI[lang].back}
          </Link>
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setLangInUrl(l);
                }}
                className={`px-3 py-1 rounded-full transition ${
                  l === lang ? "bg-amber-300 text-black" : "text-white/60 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-amber-200 mb-3">
          {doc.title}
        </h1>
        <p className="text-xs text-white/40 mb-8">
          {UI[lang].lastUpdated}: {LAST_UPDATED}
        </p>

        <p className="text-white/75 leading-relaxed mb-10">{doc.intro}</p>

        <div className="space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold text-amber-100 mb-3">{s.h}</h2>
              <div className="space-y-3 text-white/70 leading-relaxed text-sm">
                {s.p.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-6 text-xs text-white/40 text-center">
          {COMPANY.name} · NIPC {COMPANY.nif} · {COMPANY.address}
        </div>
      </div>
    </div>
  );
}

export function TermsPage({ defaultLang }: { defaultLang: Lang }) {
  const initial = useMemo(() => detectLang(defaultLang), [defaultLang]);
  const [lang, setLang] = useState<Lang>(initial);
  return <LegalLayout doc={TERMS[lang]} lang={lang} setLang={setLang} />;
}

export function PrivacyPage({ defaultLang }: { defaultLang: Lang }) {
  const initial = useMemo(() => detectLang(defaultLang), [defaultLang]);
  const [lang, setLang] = useState<Lang>(initial);
  return <LegalLayout doc={PRIVACY[lang]} lang={lang} setLang={setLang} />;
}
