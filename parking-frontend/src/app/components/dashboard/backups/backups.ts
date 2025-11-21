import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../../services/backup.service';

interface BackupFile {
  filename: string;
  path: string;
  size: number;
  sizeMB: string;
  createdAt: string;
  readableDate: string;
  type: 'json' | 'sql';
}

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule],
  templateUrl: './backups.html',
  styleUrls: ['./backups.css']
})
export class BackupsComponent implements OnInit, OnDestroy {
  
  backups: BackupFile[] = [];
  loading = false;
  downloading = false;

  progress = 0;
  progressMessage = "";
  backupFile = "";
  isBackingUp = false;
  private eventSource?: EventSource;

  // Agregar estas propiedades
  viewingBackup = false;
  selectedBackup: any = null;
  backupContent: any = null;
  backupServiceResponse: any = null;

  constructor(private backupService: BackupService) {}

  ngOnInit() {
    this.loadBackups();
  }

  ngOnDestroy() {}

  loadBackups() {
    this.loading = true;
    this.backupService.getBackups().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.backups = res.data;
        } else {
          console.error("Error en respuesta del servidor", res);
          this.backups = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error("Error cargando backups", error);
        alert("Error cargando la lista de backups.");
        this.backups = [];
      }
    });
  }

  createBackup() {
    this.loading = true;
    this.backupService.createBackup().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          // Cargar la lista de backups después de crear uno nuevo
          this.loadBackups();
          alert(`Backup creado correctamente: ${res.file}`);
        } else {
          alert('Error creando backup: ' + (res.message || 'Error desconocido'));
        } 
      },
        error: (error) => {
          this.loading = false;
          console.error("Error creando backup", error);
          alert("Error creando el backup.");
      }
    });
  }

  downloadBackup(file: BackupFile) {
    this.downloading = true;
    this.backupService.downloadBackup(file.filename).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        
        // Crear URL temporal para descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        link.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.downloading = false;
        console.error('Error descargando:', error);
        alert('Error al descargar el backup');
      }
    });
  }

  createSqlBackup() {
    this.loading = true;
    this.backupService.createSqlBackup().subscribe({
        next: (res) => {
            this.loading = false;
            if (res.success) {
              // Cargar la lista de backups después de crear uno nuevo
              this.loadBackups();
              alert(`Backup SQL creado: ${res.file} (${res.size} MB)`);
            } else {
              alert('Error creando backup SQL');
            }
        },
        error: (error) => {
            this.loading = false;
            alert('Error al crear backup SQL');
        }
    });
  }

  // Método para ver JSON
  viewJsonBackup(file: BackupFile) {
      if (file.type !== 'json') {
          alert('Solo se puede visualizar el contenido de backups JSON');
          return;
      }

      this.viewingBackup = true;
      this.selectedBackup = file;

      this.backupService.viewJsonBackup(file.filename).subscribe({
          next: (res) => {
              if (res.success) {
                  this.selectedBackup = file;
                  this.backupContent = res.data;
              } else {
                  alert('Error cargando el backup: ' + (res.message || 'Error desconocido'));
              }
          },
          error: (error) => {
              this.viewingBackup = false;
              console.error('Error visualizando backup:', error);
              alert('Error al cargar el contenido del backup');
          }
      });
  }

  // Método para cerrar la vista
  closeView() {
      this.viewingBackup = false;
      this.selectedBackup = null;
      this.backupContent = null;
  }

  calculateTotalRecords(data: any): number {
    if (!data) return 0;
    let total = 0;
    for (const table in data) {
        if (Array.isArray(data[table])) {
            total += data[table].length;
        }
    }
    return total;
  }

  getTableCount(): number {
    if (!this.backupContent || !this.backupContent.data) return 0;
    return Object.keys(this.backupContent.data).length;
  }

  getTotalRecords(): number {
    return this.calculateTotalRecords(this.backupContent?.data);
  }

  getLocalTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES').replace(/\//g, '-');
    const time = now.toLocaleTimeString('es-ES').replace(/:/g, '-');
    
    return `${date}_${time}`;
  }
}
