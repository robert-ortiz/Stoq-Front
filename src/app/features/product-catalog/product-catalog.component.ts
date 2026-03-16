import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

interface Product {
  code: string;
  name: string;
  category: string;
  unit: string;
  stockMin: number;
  stockActual: number;
}

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'catalog-container'
  }
})
export class ProductCatalogComponent implements OnInit {
  filterForm: FormGroup;
  addProductForm: FormGroup;
  categoryForm: FormGroup;

  showAddModal = false;
  showCategoriesModal = false;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];

  constructor(private router: Router, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      search: [''],
      category: [''],
      stockStatus: ['']
    });

    this.addProductForm = this.fb.group({
      code: ['', []],
      name: ['', []],
      category: ['', []],
      unit: ['', []],
      stockMin: [0, []],
      stockActual: [0, []]
    });

    this.categoryForm = this.fb.group({
      name: ['', []]
    });
  }

  ngOnInit() {
    this.applyFilters();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters() {
    const { search, category, stockStatus } = this.filterForm.value;
    const searchTerm = (search || '').toString().trim().toLowerCase();
    const categoryTerm = (category || '').toString().trim().toLowerCase();
    const statusTerm = (stockStatus || '').toString().trim().toLowerCase();

    this.filteredProducts = this.products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.code.toLowerCase().includes(searchTerm) ||
        product.name.toLowerCase().includes(searchTerm);

      const matchesCategory =
        !categoryTerm || product.category.toLowerCase().includes(categoryTerm);

      const isCritical = product.stockActual <= product.stockMin;
      const statusLabel = isCritical ? 'crítico' : 'normal';
      const matchesStatus = !statusTerm || statusLabel === statusTerm;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  getStatus(product: Product) {
    return product.stockActual <= product.stockMin ? 'CRÍTICO' : 'NORMAL';
  }

  getStatusClass(product: Product) {
    return product.stockActual <= product.stockMin ? 'status status-critical' : 'status status-normal';
  }

  openAddProduct() {
    this.addProductForm.reset({
      code: this.generateProductCode(),
      name: '',
      category: '',
      unit: '',
      stockMin: 0,
      stockActual: 0
    });
    this.showAddModal = true;
  }

  closeAddProduct() {
    this.showAddModal = false;
  }

  submitAddProduct() {
    if (this.addProductForm.invalid) {
      this.addProductForm.markAllAsTouched();
      return;
    }

    const newProduct: Product = this.addProductForm.value;
    this.products = [...this.products, newProduct];
    this.applyFilters();
    this.closeAddProduct();
  }

  openManageCategories() {
    this.categoryForm.reset({ name: '' });
    this.showCategoriesModal = true;
  }

  closeManageCategories() {
    this.showCategoriesModal = false;
  }

  addCategory() {
    const category = this.categoryForm.value.name?.toString().trim();
    if (!category) return;

    if (!this.categories.includes(category)) {
      this.categories = [...this.categories, category];
    }

    this.categoryForm.reset({ name: '' });
  }

  removeCategory(category: string) {
    this.categories = this.categories.filter((c) => c !== category);
  }

  private generateProductCode(): string {
    const next = this.products.length + 1;
    return `PROD${String(next).padStart(3, '0')}`;
  }

  onManageCategories() {
    this.openManageCategories();
  }

  onLogout() {
    this.router.navigate(['/auth/login']);
  }
}
