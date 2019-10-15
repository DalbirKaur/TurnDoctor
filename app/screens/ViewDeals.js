import React, {Component} from 'react';
import {ScrollView, View, ListView, FlatList} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import * as STYLES from '../styles/GlobalCSS';
import { Container, Button, Text } from 'native-base';
import styles from '../styles/MainCss';
import { Icon, ButtonGroup } from "react-native-elements";
import TextStyle from '../components/TextStyle';
import MainHeader from '../components/MainHeader';
import DealListItem from '../components/DealListItem';
import OfferDialogs from '../components/OfferDialogs';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
  listenOrientationChange as lor,
  removeOrientationListener as rol
} from 'react-native-responsive-screen';
import * as CONST from '../constants/Constants';
import ItemPlaceholder from '../components/ItemPlaceholder';
import DropdownAlert from 'react-native-dropdownalert';

export default class ViewDeals extends Component<Props>{
    constructor(props){
        super(props);
        this.dealItem = {};
        const {navigation} = this.props;
        let listingId = navigation.getParam('listingId');
        this.state = {
            listingId:listingId,
            isReady:false,
            counterOfferValue:null,
            counterOffer:false,
            offer:null,
            listViewData:[],
        };
    }

    onBackPress = () => {
        console.log("goback");
        this.props.navigation.state.params.refreshData();
        this.props.navigation.goBack();
    }
    toolbarLeftBody =
        {
            name:'angle-left',
            type:'FontAwesome',
            onPress:this.onBackPress,
        }
    ;

    toolbarHeading = {
        text: 'Deals',
    };

    declineAll = () => {
        this.offerDialogs.showDeclineDialog({declineAll:true});
    }

    toolbarRightBody =
        {
            name:'Decline All',
            onPress:this.declineAll,
        }
    ;

    componentDidMount(){
        lor(this);
        this.refresh();
    }

    componentWillUnmount(){
        rol(this);
    }

    refresh = async () => {
        this.setState({isReady:false});
        const userToken = await AsyncStorage.getItem('accessToken');
        const tokenType = await AsyncStorage.getItem('tokenType');
        let data = { listingId: this.state.listingId };
        fetch( CONST.API_URL + CONST.GET_DEALS, {
            method: 'POST',
            headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': tokenType+' '+userToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((responseJson) => {
            console.log(responseJson);
            if(responseJson.success)
            {
                this.setState({listViewData:responseJson.data, isReady:true});
            }
            else{
                console.log(responseJson);
            }
        })
        .catch((error) => {
            console.error(error);
//                this.dropdown.alertWithType('error', 'Error', "Something went wrong.");
            return error;
        });
    }

    showConfirmationDialog = (deal) => {
        console.log(deal);
        confirmationObject = {id: deal.listing_id, price: deal.deal_price, dealId:deal.id}
        this.offerDialogs.showconfirmationDialog(confirmationObject);
    }

    confirmationHandler = async (confirmationObject) => {
        const userToken = await AsyncStorage.getItem('accessToken');
        const tokenType = await AsyncStorage.getItem('tokenType');

        let data = { listingId: this.state.listingId,
        dealDetailId:confirmationObject.dealId};
        fetch( CONST.API_URL + CONST.ACCEPT_DEAL, {
            method: 'POST',
            headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': tokenType+' '+userToken,
            'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((responseJson) => {
            if(responseJson.success)
            {
                console.log(responseJson);
                let newListData = [...this.state.listViewData];
//                newListData = deleteRowById(confirmationObject.id,newListData);
//                this.setState({listViewData:newListData});
                this.dropdown.alertWithType('success', 'Success', responseJson.data);
                setTimeout(()=>{this.onBackPress()}, 2000);
//                this.onBackPress();
            }
            else{
                console.log(responseJson);
                this.dropdown.alertWithType('error', 'Error', responseJson.error);
            }
        })
        .catch((error) => {
            console.error(error);
            this.dropdown.alertWithType('error', 'Error', "Something went wrong.");
            return error;
        });
    }

    showCounterOfferDialog = (offer) => {
        console.log("Counter Offer");
        this.setState({offer:offer});
        console.log(offer);
        this.offerDialogs.showCounterOfferDialog(offer);
    }
    setCounterOfferValues = async (value, dealData) => {
        this.dealItem[dealData.id].setLoader(true);
        const userToken = await AsyncStorage.getItem('accessToken');
        const tokenType = await AsyncStorage.getItem('tokenType');
        let data = { listingId: dealData.listing_id,
            dealValue: value,
            counterDeal:true,
            dealDetailId: dealData.id
        };
        fetch( CONST.API_URL + CONST.MAKE_A_DEAL, {
                method: 'POST',
                headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': tokenType+' '+userToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((responseJson) => {
            console.log(responseJson);
            if(responseJson.success)
            {
                console.log(responseJson);
                newOffer = dealData;
                newOffer.counter_deal_price = value;
                this.setState({newOffer:newOffer});
                offerId = dealData.id;
                this.dealItem[dealData.id].setOffer(newOffer);
                this.dealItem[dealData.id].setLoader(false);
                this.setState({openedAuctionId:null, openedOffer:null});
                this.dropdown.alertWithType('success', 'Success', responseJson.data);
            }
            else{
                this.dealItem[dealData.id].setLoader(false);
                this.setState({openedAuctionId:null, openedOffer:null});
                console.log(responseJson);
                this.dropdown.alertWithType('error', 'Error', responseJson.error);
            }
        })
        .catch((error) => {
            console.error(error);
            this.dealItem[dealData.id].setLoader(false);
            this.dropdown.alertWithType('error', 'Error', "Something went wrong.");
            return error;
        });
        this.setState({offer:value});
    }

    showDeclineDialog = (deal) => {
        declineObject = {id: deal.listing_id, price: deal.deal_price, dealId:deal.id}
        this.offerDialogs.showDeclineDialog(declineObject);
    }

    deleteRowById = (value, myArray) =>{
        var key = null;
        console.log(myArray);
        for (var i=0; i < myArray.length; i++) {
            console.log(myArray[i].listing_id == value);
            if (myArray[i].id == value) {
                key = i;
            }
        }
        console.log(key);
        if(key != null)
        {

            myArray.splice(key, 1);
        }
        return myArray;
    }

    declineHandler = async (declineObject) => {
        const userToken = await AsyncStorage.getItem('accessToken');
        const tokenType = await AsyncStorage.getItem('tokenType');
        let data = {};
        let link = '';
        if(!declineObject.hasOwnProperty('reasonString')){
            link = CONST.DECLINE_DEAL;
            data = { dealDetailId: declineObject.dealId};
        }else{
            link = CONST.DECLINE_ALL_DEALS;
            data = { listingId: this.state.listingId, reason: declineObject.reasonString};
        }

        fetch( CONST.API_URL + link, {
            method: 'POST',
            headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': tokenType+' '+userToken,
            'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((responseJson) => {
            if(responseJson.success)
            {
                console.log(responseJson);
                this.dropdown.alertWithType('success', 'Success', responseJson.data);
                if(declineObject.hasOwnProperty('reasonString')){
                   setTimeout(()=>{this.onBackPress()}, 2000);
                }else{
                    let newListData = [...this.state.listViewData];
                    this.dealItem[declineObject.dealId].animate();
                    newListData = deleteRowById(declineObject.dealId,newListData);
                    this.setState({listViewData:newListData});
                    this.dropdown.alertWithType('success', 'Success', responseJson.data);
                }
            }
            else{
                console.log(responseJson);
                this.dropdown.alertWithType('error', 'Error', responseJson.error);
            }
        })
        .catch((error) => {
            console.error(error);
            this.dropdown.alertWithType('error', 'Error', "Something went wrong.");
            return error;
        });
    }

    render(){
        return(
            <Container >
                <MainHeader onPress={this.onBackPress} leftBody={this.toolbarLeftBody} heading={this.toolbarHeading} rightBody={this.toolbarRightBody} rightBodyType='Text' />
                {!this.state.isReady?(<ItemPlaceholder />)
                :(
                <ScrollView style={STYLES.containerStyle()}>
                     <FlatList
                        data={this.state.listViewData}
                        extraData={this.state}
                        keyExtractor={(item, index) => item.id}
                        renderItem={({item,index}) => <DealListItem
                        ref={ref => {this.dealItem =  { ...this.dealItem, [item.id]: ref};} }
                        showDeclineDialog={this.showDeclineDialog}
                        showCounterOfferDialog={this.showCounterOfferDialog}
                        showConfirmationDialog={this.showConfirmationDialog} deal={item} />}
                     />

                </ScrollView>
                )}
                <OfferDialogs
                confirmationHandler={this.confirmationHandler}
                declineHandler={this.declineHandler}
                setCounterOfferValues={this.setCounterOfferValues}
                ref={ref => this.offerDialogs =ref} />
                <DropdownAlert ref  = {ref => this.dropdown = ref} />
            </Container>
        );
    }
}