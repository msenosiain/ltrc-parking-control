import {Component, DestroyRef, inject, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {Member} from '../../member.interface';
import {MembersService} from '../../members.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatSort, MatSortable, MatSortModule} from '@angular/material/sort';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MemberItemComponent} from '../member-item/member-item.component';
import {ConfirmDialogComponent} from '../../../common/components/confirm-dialog/confirm-dialog.component';
import {Role} from '../../../auth/roles.enum';
import {AllowedRolesDirective} from '../../../auth/directives/allowed-roles.directive';
import {MemberBulkUploadComponent} from '../member-bulk-upload/member-bulk-upload.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'ltrc-members-list',
  imports: [CommonModule, MatButtonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatInputModule, MatIconModule, FormsModule, AllowedRolesDirective, MatToolbarModule],
  templateUrl: './members-list.component.html',
  styleUrl: './members-list.component.scss'
})
export class MembersListComponent implements OnInit {

  destroyRef = inject(DestroyRef);
  Role = Role;

  displayedColumns: string[] = ['fullName', 'dni', 'actions'];
  dataSource = new MatTableDataSource<Member>();
  totalMembers = 0;
  currentPage = 1;
  pageSize = 25;
  query = '';

  member!: Member;

  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort!: MatSort;


  constructor(private membersService: MembersService) {
  }

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.sort.sort(({id: 'fullName', start: 'asc'}) as MatSortable)
    this.dataSource.sort = this.sort;

    this.sort.sortChange.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadMembers();
    });

    this.loadMembers();
  }

  loadMembers(): void {

    this.membersService.getMembers(this.query, this.currentPage, this.pageSize, this.sort?.active, this.sort?.direction).pipe(
      takeUntilDestroyed(this.destroyRef))
      .subscribe(response => {
        this.dataSource.data = response.data;
        this.totalMembers = response.total;
        this.paginator.length = this.totalMembers;
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadMembers();
  }

  applyFilter() {
    this.loadMembers();
  }

  clearFilter() {
    this.query = '';
    this.loadMembers();
  }

  createMember() {
    const dialogRef = this.dialog.open(MemberItemComponent, {
      width: '90vw',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const memberPayload = this.buildMemberPayload(result);
        this.membersService.createMember(memberPayload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() =>
          this.loadMembers()
        );
      }
    });
  }

  openBulkUpload() {
    const dialogRef = this.dialog.open(MemberBulkUploadComponent, {
      width: '90vw',
      maxWidth: '800px',
      data: null,
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  editMember(member: Member) {
    const dialogRef = this.dialog.open(MemberItemComponent, {
      width: '90vw',
      maxWidth: '500px',
      data: member,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const memberPayload = this.buildMemberPayload(result)
        this.membersService.updateMember(member._id, memberPayload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() =>
          this.loadMembers()
        )
        ;
      }
    });
  }

  deleteMember(member: Member) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `Está seguro que desea eliminar a:
        ${member.fullName} DNI: ${member.dni}?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // 🔥 User confirmed, proceed with delete
        this.membersService.deleteMember(member._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.loadMembers();
        });
      }
    });
  }

  private buildMemberPayload(result: { lastName: string; name: string; dni: string }): Member {
    return {
      _id: '',
      fullName: `${result.lastName} ${result.name}`,
      dni: result.dni
    } as Member;
  }
}
