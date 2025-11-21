import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../../services/audit.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-trail.html',
  styleUrls: ['./audit-trail.css'],
  encapsulation: ViewEncapsulation.None
})
export class AuditTrailComponent implements OnInit {

  logs: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  isLoading = false;

  // raw string (opcional, para depuración)
  selectedSqlRaw: string | null = null;
  // SafeHtml que usamos en el template
  selectedSqlSafe: SafeHtml | null = null;

  selectedRollbackRaw: string | null = null;
  selectedRollbackSafe: SafeHtml | null = null;

  showSqlModal: boolean = false;
  showRollbackModal: boolean = false;

  constructor(private auditService: AuditService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
  this.isLoading = true;

  this.auditService.getAuditLogs(this.currentPage, this.itemsPerPage).subscribe({
    next: (res) => {
      this.logs = res.data;
      this.totalPages = res.pagination.pages;
      this.totalItems = res.pagination.total;
      this.isLoading = false;
    },
    error: () => {
      this.isLoading = false;
      alert("Error cargando auditoría");
    }
  });
}


  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAuditLogs();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAuditLogs();
    }
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return '--';
      return new Date(dateTime).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
  }

  openSqlModal(sql: string) {
    this.selectedSqlRaw = sql;
    const html = this.highlightSQLString(sql);
    this.selectedSqlSafe = this.sanitizer.bypassSecurityTrustHtml(html);
    this.showSqlModal = true;
  }
  openRollbackModal(sql: string) {
    this.selectedRollbackRaw = sql;
    const html = this.highlightSQLString(sql);
    this.selectedRollbackSafe = this.sanitizer.bypassSecurityTrustHtml(html);
    this.showRollbackModal = true;
  }

  closeModals() {
    this.showSqlModal = false;
    this.showRollbackModal = false;
    this.selectedSqlRaw = null;
    this.selectedSqlSafe = null;
    this.selectedRollbackRaw = null;
    this.selectedRollbackSafe = null;
  }

  // helper debug: imprime la salida HTML en consola
  debugHighlighted(sql: string) {
    console.log('RAW SQL:', sql);
    console.log('HIGHLIGHTED HTML:', this.highlightSQLString(sql));
  }

  // función que convierte SQL plano -> HTML string con spans
  // Dentro de tu componente (mantén la inyección de DomSanitizer y el resto igual)
  highlightSQLString(sql: string): string {
  if (!sql) return '';

  // 0) Insertar saltos de línea entre sentencias SQL
  sql = sql.replace(/;\s*(?=(SELECT|UPDATE|INSERT|DELETE)\b)/gi, ';\n');

  // 1) Escape básico (convierte <, >, & para evitar HTML real)
  let text = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2) Preparar placeholders para keywords (no contienen comillas)
  const keywords = [
    'SELECT','UPDATE','INSERT','DELETE',
    'FROM','WHERE','SET','VALUES',
    'INTO','JOIN','LEFT','RIGHT',
    'AND','OR','ON','ORDER','GROUP','BY'
  ];

  // Map para placeholders
  const placeholders: { token: string; word: string }[] = [];
  let tokenIndex = 0;

  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  text = text.replace(keywordRegex, (m) => {
    const token = `@@KW${tokenIndex}@@`;
    placeholders.push({ token, word: m.toUpperCase() });
    tokenIndex++;
    return token; // insertamos token en lugar de tag
  });

  // 3) Resaltar strings (ya no existen tags, por tanto "class=" no aparece aquí)
  text = text.replace(/"([^"]*)"/g, (m, inner) => {
    return `<span class="sql-string">"${inner}"</span>`;
  });
  text = text.replace(/'([^']*)'/g, (m, inner) => {
    return `<span class="sql-string">'${inner}'</span>`;
  });

  // 4) Resaltar números
  text = text.replace(/\b\d+(\.\d+)?\b/g, (m) => `<span class="sql-number">${m}</span>`);

  // 5) Reemplazar placeholders por spans (al final, ya no hay riesgos)
  placeholders.forEach(p => {
    const span = `<span class="sql-keyword">${p.word}</span>`;
    // replace all occurrences of token
    text = text.split(p.token).join(span);
  });

  return text;
}





}
