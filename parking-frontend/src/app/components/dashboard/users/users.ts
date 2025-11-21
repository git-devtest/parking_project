// src/app/components/dashboard/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../services/users.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {

  users: any[] = [];
  paginatedUsers: any[] = [];

  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  showFormModal = false;
  showDeleteModal = false;

  editMode = false;
  form: any = {};
  selectedUser: any = null;

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe((resp: any) => {
      this.users = resp.data || [];
      this.applyFilter();
    });
  }

  applyFilter() {
    let filtered = this.users;

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = this.users.filter(u =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.paginatedUsers = filtered.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilter();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilter();
    }
  }

  openCreateModal() {
    this.closeModals();   // Cierra otros modales abiertos

    this.editMode = false;
    this.form = {
      username: '',
      email: '',
      role: 'OPERATOR',
      password: '',
      isActive: 1
    };
    this.showFormModal = true;
  }


  openEditModal(user: any) {
    this.closeModals();   // Cierra otros modales abiertos

    this.selectedUser = user;
    this.editMode = true;

    // mapear al form, incluyendo isActive (que en DB es 1/0 o boolean)
    this.form = {
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'OPERATOR',
      password: '',
      isActive: (user.isActive === 1 || user.isActive === true) ? 1 : 0
    };
    this.showFormModal = true;
  }


  openDeleteModal(user: any) {
    this.closeModals();   // Cierra otros modales abiertos
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showFormModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  saveUser() {
    const payload: any = {};
    if (this.form.username?.trim()) payload.username = this.form.username.trim();
    if (this.form.email?.trim()) payload.email = this.form.email.trim();
    if (this.form.role?.trim()) payload.role = this.form.role.trim();
    if (this.form.password?.trim()) payload.password = this.form.password.trim();
    if (this.editMode) payload.isActive = this.form.isActive;
    if (this.editMode) {
      this.usersService.updateUser(this.selectedUser.id, payload).subscribe(() => {
        this.closeModals();
        this.loadUsers();
      });
    } else {
      this.usersService.createUser(payload).subscribe(() => {
        this.closeModals();
        this.loadUsers();
      });
    }
  }

  /*createUser() {
    this.usersService.createUser(this.form).subscribe(() => {
      this.closeModals();
      this.loadUsers();
    });
  }

  updateUser() {
    this.usersService.updateUser(this.selectedUser.id, this.form).subscribe(() => {
      this.closeModals();
      this.loadUsers();
    });
  }*/

  confirmDelete() {
    this.usersService.deleteUser(this.selectedUser.id).subscribe(() => {
      this.closeModals();
      this.loadUsers();
    });
  }
}