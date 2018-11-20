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
  private pageCount;
  private rowClassRules;

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
    this.cacheBlockSize = 50;
    this.maxBlocksInCache = 5;
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

    // this.http.get('https://api.discogs.com/artists/3/releases')
    //   .pipe(
    //     tap(),
    //     catchError((err: HttpErrorResponse) => {
    //       return Observable.throw(err);
    //     })
    //   )
    //   .subscribe(
    //     (data) => {
    //       if (data.hasOwnProperty('releases')) {
    //         this.rowData = data['releases'];
    //       }
    //       // console.log(data['releases']);
    //     });
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
          // this.rowClassRules = {
          //   'bold_row': function(params1) {
          //     const format = params1.data.status;
          //     const bo = format === 'Accepted';
          //     return bo;
          //   }
          // };
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
    let topRow = this.gridApi.getFirstDisplayedRow();
    if (topRow > 0) {
      topRow = topRow + 11;
    }
    return topRow;
  }

  displayBottomRow() {
    let bottomRow = this.gridApi.getLastDisplayedRow();
    if (bottomRow < this.gridCount) {
      bottomRow = bottomRow - 11;
    }
    return bottomRow;
  }

  gotoNextPage() {
    if (this.pagination) {
      this.gridApi.paginationGoToNextPage();
    } else {
      // let bottomRow = this.gridApi.getLastDisplayedRow();
      // if (bottomRow < this.gridCount) {
      //   bottomRow = bottomRow - 11;
      // }
      this.gridApi.ensureIndexVisible(this.displayBottomRow(), 'top');
      // this.pageCurrent++;
      // console.log('go to next page, row: ', this.pageCurrent * this.paginationPageSize);
      // const position = this.pageCurrent * this.paginationPageSize;
      // if (this.gridApi.paginationGetRowCount() < position + 1) {
      //   this.gridApi.ensureIndexVisible(this.gridApi.paginationGetRowCount() - 1, 'bottom');
      //   setTimeout(
      //     () => this.gridApi.ensureIndexVisible(this.pageCurrent * this.paginationPageSize, 'top'),
      //     1000);
      // } else {
      //   this.gridApi.ensureIndexVisible(this.pageCurrent * this.paginationPageSize, 'top');
      // }
    }
  }

  gotoPreviousPage() {
    if (this.pagination) {
      this.gridApi.paginationGoToPreviousPage();
    } else {
      // let topRow = this.gridApi.getFirstDisplayedRow();
      // if (topRow > 0) {
      //   topRow = topRow + 11;
      // }
      this.gridApi.ensureIndexVisible(this.displayTopRow(), 'bottom');
      // console.log('top row: ', topRow);
      // this.pageCurrent--;
      // this.gridApi.ensureIndexVisible(this.pageCurrent * this.paginationPageSize, 'top');
    }
  }

  gotoToPage(num: number) {
    if (this.pagination) {
      this.gridApi.paginationGoToPage(num);
      // this.paginationController = this.gridApi.paginationController;
      // this.paginationController.currentPage = num;
      // this.paginationController.loadPage();
    } else {
      // let topRow = this.gridApi.getFirstDisplayedRow();
      // if (topRow > 0) {
      //   topRow = topRow + 11;
      // }
      // let bottomRow = this.gridApi.getLastDisplayedRow();
      // if (bottomRow < this.gridCount) {
      //   bottomRow = bottomRow - 11;
      // }
      const pageSize = this.displayBottomRow() - this.displayTopRow();
      this.gridApi.ensureIndexVisible(pageSize * (num - 1), 'top');
      // this.gridApi.ensureIndexVisible(num * this.paginationPageSize, 'top');
      // this.pageCurrent = num;
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

}

// function ServerSideDatasource(server) {
//   return {
//     getRows(params) {
//       setTimeout(function() {
//         const response = server.getResponse(params.request);
//         if (response.success) {
//           params.successCallback(response.rows, response.lastRow);
//         } else {
//           params.failCallback();
//         }
//       }, 500);
//     }
//   };
// }
// function FakeServer(allData) {
//   return {
//     getResponse(request) {
//       console.log('asking for rows: ' + request.startRow + ' to ' + request.endRow);
//       const rowsThisPage = allData.slice(request.startRow, request.endRow);
//       const lastRow = allData.length <= request.endRow ? allData.length : -1;
//       return {
//         success: true,
//         rows: rowsThisPage,
//         lastRow: lastRow
//       };
//     }
//   };
// }
