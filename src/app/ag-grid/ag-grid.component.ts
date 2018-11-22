import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import 'ag-grid-enterprise';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';


@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
})
export class AgGridComponent implements OnInit {

  private gridApi;
  private gridColumnApi;

  private rowModelType;
  private cacheBlockSize;
  private maxBlocksInCache;
  private page;
  private isFirstTime;
  private readonly paginationPageSize;
  private pageCurrent;
  private readonly pagination;
  private lastRow;
  private paginationController;
  private gridCount = 499;
  private countPage;
  private rowClassRules;
  private pageSize = -1;

  rowData: any;

  columnDefs = [
    {headerName: '#', field: 'num', menuTabs: ['columnsMenuTab']},
    {headerName: 'ID', field: 'id', suppressMenu: true, filter: 'agNumberColumnFilter'},
    {headerName: 'Status', field: 'status', filter: 'agTextColumnFilter'},
    {headerName: 'In collection', field: 'stats.community.in_collection', suppressFilter: true, menuTabs: [] },
    {headerName: 'In wantlist', field: 'stats.community.in_wantlist'},
    {headerName: 'Title', field: 'title'},
    {headerName: 'Format', field: 'format', filter: 'agSetColumnFilter'},
    {headerName: 'Label', field: 'label'},
    {headerName: 'Role', field: 'role'},
    {headerName: 'Year', field: 'year'},
    {headerName: 'Resource url', field: 'resource_url'},
    {headerName: 'Artist', field: 'artist'},
    {headerName: 'Type', field: 'type'},
  ];

  constructor(private http: HttpClient) {
    this.rowModelType = 'serverSide';
    this.cacheBlockSize = 100;
    this.maxBlocksInCache = 3;
    this.page = 0;
    this.isFirstTime = true;
    this.paginationPageSize = 50;
    this.pageCurrent = 1;
    this.lastRow = -1;
    this.pagination = false;

    this.rowClassRules = {
      'bold_row': function(params1) {
        if (params1.hasOwnProperty('data') && params1.data) {
          const format = params1.data.status;
          const bo = format === 'Accepted';
          return bo;
        }
        return false;
      }
    };

  }

  ngOnInit() {

  }

  onGridReady(params)  {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    console.log('pix: ', this.gridApi.getVerticalPixelRange());

    this.http
      .get('https://api.discogs.com/artists/3/releases?per_page=1500&page=' + this.page)
      .subscribe(data => {
        if (data.hasOwnProperty('releases')) {
          const releases = data['releases'];
          let idSequence = 0;
          releases.forEach(function(item) {
            item.num = idSequence++;
          });
          const server =  this.FakeServer(releases);
          const dataSource = this.ServerSideDatasource(server);
          params.api.setServerSideDatasource(dataSource);
        }
      });
  }

  ServerSideDatasource(server) {
    return {
      getRows(params) {
        setTimeout(function() {
          const response = server.getResponse(params.request);
          if (response.success) {
            params.successCallback(response.rows, response.lastRow);
          } else {
            params.failCallback();
          }
        }, 500);
      }
    };
  }
  FakeServer(allData) {
    const that = this;
    return {
      getResponse(request) {
        console.log('asking for rows: ' + request.startRow + ' to ' + request.endRow);
        // const page = that.gridApi.paginationGetPageSize() / that.paginationPageSize + 1;
        // console.log('current page: ' + Math.round(page) );
        const rowsThisPage = allData.slice(request.startRow, request.endRow);
        let lastRow = allData.length <= request.endRow ? allData.length : -1;
        if (lastRow > 0) {
          that.lastRow = lastRow;
        } else {
          lastRow = that.gridCount;
          that.lastRow = that.gridCount;
        }
        return {
          success: true,
          rows: rowsThisPage,
          lastRow: lastRow
        };
      }
    };
  }

  displayTopRow() {
    const topRow = this.gridApi.getFirstDisplayedRow();
    // if (topRow > 0) {
    //   topRow = topRow + 11; // why 11?  ~= 20/2; 20 - default gridOptions.rowBuffer
    // }
    return topRow;
  }

  displayBottomRow() {
    const bottomRow = this.gridApi.getLastDisplayedRow();
    // if (bottomRow < this.gridCount) {
    //   bottomRow = bottomRow - 11;
    // }
    return bottomRow;
  }

  gotoFirstPage() {
    this.gridApi.ensureIndexVisible(0, 'top');
  }

  gotoNextPage() {
    if (this.pagination) {
      this.gridApi.paginationGoToNextPage();
    } else {
      // this.gridApi.ensureIndexVisible(this.displayBottomRow(), 'top');
      this.gridApi.ensureIndexVisible(this.gridApi.getLastDisplayedRow(), 'top');
      // console.log('tor top ret: ', this.gridApi.getFirstDisplayedRow());
      // console.log('tor bottom ret: ', this.gridApi.getLastDisplayedRow());
    }
  }

  gotoPreviousPage() {
    if (this.pagination) {
      this.gridApi.paginationGoToPreviousPage();
    } else {
      // this.gridApi.ensureIndexVisible(this.displayTopRow(), 'bottom');
      this.gridApi.ensureIndexVisible(this.gridApi.getFirstDisplayedRow(), 'bottom');
    }
  }

  gotoToPage(num: number) {
    if (this.pagination) {
      this.gridApi.paginationGoToPage(num);
    } else {
      const pageSize = this.getPageSize();
      this.gridApi.ensureIndexVisible(pageSize * (num - 1), 'top');
    }
  }

  gotoToLastPage() {
    if (this.pagination) {
      this.gridApi.paginationGoToLastPage();
    } else {
      if (this.lastRow > 0) {
        this.gridApi.ensureIndexVisible(this.lastRow - 1, 'bottom');
      } else {
        this.gotoNextPage();
      }
      // this.pageCurrent = num;
    }
  }

  getPageSize() {
    if (this.pageSize < 1) {
      this.pageSize = this.gridApi.getLastDisplayedRow() - this.gridApi.getFirstDisplayedRow() -
        (this.gridApi.getFirstDisplayedRow() > 0 ? 1 : 0);
    }
    return this.pageSize;
  }

  getPageCount() {
    const pages = [];
    if (this.gridApi) {
      const pageSize = this.getPageSize();
      if (pageSize > 0) {
        if (!this.countPage) {
          this.countPage = Math.round(this.gridCount / pageSize) +
            (this.gridCount / this.pageSize - Math.round(this.gridCount / pageSize) > 0 ? 1 : 0);
        }
        const currentPage = Math.round(this.gridApi.getLastDisplayedRow() / pageSize);
        const from = currentPage < 3 ? 1 : currentPage - 2;
        if (from > 1) {
          pages.push({type: '...'});
        }
        const to = currentPage + 2 >= this.countPage ? this.countPage : currentPage + 2;
        for (let i = from; i <= to; i++) {
          if (i === currentPage) {
            pages.push({type: 'bold', value: i});
          } else if (i === this.countPage) {
            pages.push({type: 'last', value: i});
          } else {
            pages.push({type: '', value: i});
          }
        }
        if (to < this.countPage) {
          pages.push({type: '...'});
        }
        // console.log('ps:', pageSize, ', cp:', currentPage,
        //   ',first: ', this.gridApi.getFirstDisplayedRow(),
        //   ', to: ', this.gridApi.getLastDisplayedRow());
      }
    }
    return pages;
  }
}

